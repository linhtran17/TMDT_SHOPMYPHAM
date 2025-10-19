package com.shopmypham.modules.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopmypham.modules.analytics.AnalyticsService;
import com.shopmypham.modules.chat.dto.AskRequest;
import com.shopmypham.modules.chat.llm.ChatLLMClient;
import com.shopmypham.modules.chat.log.ChatLog;
import com.shopmypham.modules.chat.log.ChatLogRepository;
import com.shopmypham.modules.category.CategoryRepository;
import com.shopmypham.modules.faq.FaqRepository;
import com.shopmypham.modules.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ChatService {

  private final ProductService productService;
  private final CategoryRepository categoryRepo;
  private final FaqRepository faqRepo;
  private final ChatLogRepository chatLogRepo;
  private final AnalyticsService analyticsService;

  /** Bean optional; nếu chưa cấu hình LLM thì = null */
  private final @Nullable ChatLLMClient llm;

  private final ObjectMapper om = new ObjectMapper();

  /** API chính */
  public Map<String,Object> ask(AskRequest req) {
    String msg = Optional.ofNullable(req.getMessage()).orElse("").trim();

    // ---- log: user
    saveLog("user", msg, null);

    // 0) Lời chào -> hướng dẫn ngắn gọn
    if (isGreeting(msg)) {
      String greet = """
      Chào bạn 👋 Mình là trợ lý của ShopMyPham.
      Bạn có thể hỏi: “toner 300–500k cho da dầu”, “serum sáng da <400k”, “kem chống nắng cho da nhạy cảm”… 
      """;
      saveLog("assistant", greet, null);
      return Map.of("faqIds", List.of(), "answerMd", greet, "products", List.of());
    }

    // 1) Ưu tiên FAQ
    var faqTop = faqRepo.searchTop(msg, PageRequest.of(0, 1));
    if (!faqTop.isEmpty()) {
      var f = faqTop.get(0);
      String base = "### Thông tin chính sách liên quan\n" + Optional.ofNullable(f.getAnswerMd()).orElse("");
      Map<String,Object> ctx = new HashMap<>();
      ctx.put("faqIds", List.of(f.getId()));
      String answer = rewriteSafe(base, ctx, msg);

      Map<String,Object> out = new HashMap<>();
      out.put("faqIds", List.of(f.getId()));
      out.put("answerMd", (answer == null || answer.isBlank()) ? base : answer);
      out.put("products", List.of());

      Map<String,Object> src = new HashMap<>();
      src.put("faqId", f.getId());
      saveLog("assistant", String.valueOf(out.get("answerMd")), jsonSafe(src));
      return out;
    }

    // 2) Phân tích ngôn ngữ tự nhiên
    ParsedSlots slots = parseSlotsVi(msg);

    // FE override khoảng giá nếu truyền
    if (req.getPriceMin()!=null) slots = slots.withPriceMin(req.getPriceMin());
    if (req.getPriceMax()!=null) slots = slots.withPriceMax(req.getPriceMax());

    final Integer fMin = slots.priceMin();
    final Integer fMax = slots.priceMax();

    int limit = Optional.ofNullable(req.getTopKProducts()).orElse(6);

    // 3) Lọc & lấy sản phẩm theo yêu cầu
    Map<String,Object> args = new HashMap<>();
    args.put("q", slots.keyword());
    args.put("categoryId", slots.categoryId());
    args.put("catSlug", slots.catSlug());
    args.put("priceMin", slots.priceMin());
    args.put("priceMax", slots.priceMax());
    args.put("attrName", slots.attrName());
    args.put("attrVal", slots.attrVal());
    args.put("limit", limit);

    List<Map<String,Object>> cards = productService.listForChat(args); // có thể rỗng

    // 3a) Nếu lọc theo thuộc tính không ra → thử lại KHÔNG attr
    if ((cards == null || cards.isEmpty()) && (slots.attrName()!=null || slots.attrVal()!=null)) {
      Map<String,Object> argsNoAttr = new HashMap<>(args);
      argsNoAttr.remove("attrName");
      argsNoAttr.remove("attrVal");
      cards = productService.listForChat(argsNoAttr);
    }

    // 3b) Fallback: gợi ý chung/top bán chạy 60 ngày
    boolean genericIntent = isGenericSuggestIntent(msg);
    String note = null;

    if (genericIntent || cards == null || cards.isEmpty()) {
      LocalDate to = LocalDate.now();
      LocalDate from = to.minusDays(60);

      Long topCatId = slots.categoryId();
      var tops = analyticsService.topProducts(from, to, topCatId, limit);

      if (tops != null && !tops.isEmpty()) {
        List<Long> topIds = tops.stream().map(AnalyticsService.TopProductRow::productId).toList();

        List<Map<String,Object>> topCardsFiltered = productService.cardsByProductIds(topIds).stream()
            .filter(c -> withinPriceCard(c, fMin, fMax))
            .toList();

        List<Map<String,Object>> topCards = topCardsFiltered;
        boolean priceRelaxed = false;
        if (topCards.isEmpty()) {
          topCards = productService.cardsByProductIds(topIds);
          priceRelaxed = !topCards.isEmpty();
        }

        if (!topCards.isEmpty()) {
          cards = topCards;
          String group = (topCatId != null && slots.categoryName()!=null)
              ? ("Bán chạy 60 ngày (" + slots.categoryName() + ")")
              : "Bán chạy 60 ngày gần đây";
          slots = slots.withCategoryName(group);
          note = priceRelaxed ? "fallback_top_sellers_price_relaxed" : "fallback_top_sellers_60_days";
        }
      }
    }

    // 4) Soạn câu trả lời cơ bản
    StringBuilder md = new StringBuilder();
    if (cards != null && !cards.isEmpty()) {
      md.append("**Mình gợi ý cho bạn vài sản phẩm phù hợp nhé! 💖**\n\n");
      if (slots.categoryName()!=null)
        md.append("- Nhóm: **").append(slots.categoryName()).append("**\n");
      if (slots.attrName()!=null && slots.attrVal()!=null)
        md.append("- Phù hợp với ").append(slots.attrName().toLowerCase()).append(": **")
          .append(slots.attrVal()).append("**\n");
      if (slots.priceMin()!=null || slots.priceMax()!=null)
        md.append("- Tầm giá: **")
          .append(slots.priceMin()==null? "" : String.format("%,d₫", slots.priceMin()))
          .append(" — ")
          .append(slots.priceMax()==null? "" : String.format("%,d₫", slots.priceMax()))
          .append("**\n");
      if (genericIntent && (slots.keyword()==null && slots.categoryId()==null && slots.catSlug()==null))
        md.append("- Tiêu chí: **Top bán chạy 60 ngày gần đây**\n");
      if ("fallback_top_sellers_price_relaxed".equals(note)) {
        md.append("- Lưu ý: top bán chạy có thể **vượt tầm giá**; mình vẫn hiển thị để bạn tham khảo.\n");
      }
      md.append("\n✨ Dưới đây là những sản phẩm bạn có thể tham khảo:\n");
    } else {
      md.append("Mình chưa tìm thấy sản phẩm nào khớp yêu cầu 😥.\n")
        .append("Bạn thử mô tả rõ hơn, ví dụ: *“kem dưỡng cho da dầu dưới 300k”* hoặc *“mặt nạ dưỡng ẩm ban đêm”*.");
    }

    String baseAnswer = naturalReply(slots, cards != null && !cards.isEmpty()) + "\n\n" + md;

    // 5) Cho LLM viết lại (nếu có) trên đúng Context
    Map<String,Object> filters = new HashMap<>();
    filters.put("keyword", slots.keyword());
    filters.put("categoryId", slots.categoryId());
    filters.put("catSlug", slots.catSlug());
    filters.put("priceMin", slots.priceMin());
    filters.put("priceMax", slots.priceMax());
    filters.put("skinAttrName", slots.attrName());
    filters.put("skinAttrVal", slots.attrVal());
    if (note != null) filters.put("note", note);
    else if (genericIntent) filters.put("note", "fallback_top_sellers_60_days");

    Map<String,Object> context = new HashMap<>();
    context.put("filters", filters);
    context.put("products", cards == null ? List.of() : cards);

    String answer = rewriteSafe(baseAnswer, context, msg);

    // 6) Kết quả
    Map<String,Object> out = new HashMap<>();
    out.put("faqIds", List.of());
    out.put("answerMd", (answer == null || answer.isBlank()) ? baseAnswer : answer);
    out.put("products", cards == null ? List.of() : cards);

    // ---- log: assistant
    Map<String,Object> src = new HashMap<>();
    src.put("filters", filters);
    if (cards != null) {
      List<Long> productIds = new ArrayList<>();
      for (Map<String,Object> c : cards) {
        Object id = c.get("id");
        if (id instanceof Long l) productIds.add(l);
        else if (id instanceof Number n) productIds.add(n.longValue());
      }
      src.put("productIds", productIds);
    }
    saveLog("assistant", String.valueOf(out.get("answerMd")), jsonSafe(src));
    return out;
  }

  // ---------- LLM chỉ rewrite ----------
  private String rewriteSafe(String base, Map<String,Object> context, String userMessage){
    try {
      if (llm == null) return null;
      String sys = """
        Bạn là trợ lý tư vấn mỹ phẩm của ShopMyPham.
        - Trả lời thân thiện, xưng “mình”.
        - Không bịa thông tin; CHỈ dựa trên Context và văn bản base.
        - Nếu có sản phẩm: gợi ý nhẹ nhàng (💖🌸✨), súc tích.
        - Nếu không có: hướng dẫn người dùng mô tả rõ hơn (loại da / tầm giá).
      """;
      String txt = llm.complete(sys, context, userMessage);
      return (txt == null || txt.isBlank()) ? null : txt.trim();
    } catch (Exception ignore) {
      return null;
    }
  }

  private String naturalReply(ParsedSlots s, boolean foundProducts) {
    StringBuilder m = new StringBuilder();
    if (foundProducts) {
      m.append("Mình thấy vài sản phẩm phù hợp");
      if (s.categoryName()!=null) m.append(" trong nhóm **").append(s.categoryName()).append("**");
      if (s.attrVal()!=null)     m.append(" cho da **").append(s.attrVal().toLowerCase()).append("**");
      if (s.priceMax()!=null)    m.append(" dưới **").append(String.format("%,d₫", s.priceMax())).append("**");
      m.append(". Hãy xem thử nhé! 🌸");
    } else {
      m.append("Mình chưa tìm thấy sản phẩm chính xác 😅. ")
       .append("Bạn thử nói rõ hơn, ví dụ: *“serum sáng da dưới 400k”* hoặc *“sữa rửa mặt cho da nhạy cảm”*.");
    }
    return m.toString();
  }

  // ----------------- NLP slots -----------------
  private ParsedSlots parseSlotsVi(String msg){
    String lower = msg == null ? "" : msg.toLowerCase(Locale.ROOT);

    // Chuẩn hoá: thay en-dash/em-dash… về '-'
    String preNormalized = lower
        .replace('–','-')
        .replace('—','-')
        .replace('−','-');

    String normalized = normalizeVi(preNormalized);

    // ===== 1) Khoảng giá =====
    Integer min = null, max = null;

    var mRange = Pattern.compile(
        "(?:\\btu\\b|\\btừ\\b|\\bmin\\b|\\bkhoang\\b|\\btam\\b|\\bkhoang gia\\b|\\btam gia\\b)?\\s*"
      + "(\\d+[\\dkm\\.\\s]*)\\s*[-–to\\sđến]*\\s*(\\d+[\\dkm\\.\\s]*)"
    ).matcher(preNormalized.replaceAll("\\s+", " "));

    if (mRange.find()) {
      String r1 = mRange.group(1);
      String r2 = mRange.group(2);

      String r1l = r1.toLowerCase(Locale.ROOT);
      String r2l = r2.toLowerCase(Locale.ROOT);

      boolean r1HasK = r1l.contains("k");
      boolean r1HasM = r1l.contains("m");
      boolean r2HasK = r2l.contains("k");
      boolean r2HasM = r2l.contains("m");

      if (!r1HasK && !r1HasM && (r2HasK || r2HasM)) {
        r1 = r1 + (r2HasK ? "k" : "m");
      } else if (!r2HasK && !r2HasM && (r1HasK || r1HasM)) {
        r2 = r2 + (r1HasK ? "k" : "m");
      }

      min = parseMoney(r1);
      max = parseMoney(r2);

      if (min != null && max != null && min > max) {
        int t = min; min = max; max = t;
      }
    } else {
      var mUnder = Pattern.compile("(?:\\bduoi\\b|\\bdưới\\b|<=|<)\\s*(\\d+[\\dkm\\.\\s]*)").matcher(normalized);
      if (mUnder.find()) max = parseMoney(mUnder.group(1));

      var mOver  = Pattern.compile("(?:\\btren\\b|\\btrên\\b|>=|>)\\s*(\\d+[\\dkm\\.\\s]*)").matcher(normalized);
      if (mOver.find())  min = parseMoney(mOver.group(1));
    }

    // ===== 2) Danh mục =====
    String catSlug = detectCategorySlug(normalized);
    Long categoryId = null;
    String categoryName = null;
    if (catSlug != null) {
      var cat = categoryRepo.findTop1BySlugIgnoreCase(catSlug);
      if (cat.isPresent()) {
        categoryId = cat.get().getId();
        categoryName = cat.get().getName();
      }
    }

    // ===== 3) Loại da =====
    String attrName = null, attrVal = null;
    if (normalized.contains("da dau"))      { attrName = "Loại da"; attrVal = "Dầu"; }
    else if (normalized.contains("da kho")) { attrName = "Loại da"; attrVal = "Khô"; }
    else if (normalized.contains("nhay cam")) { attrName = "Loại da"; attrVal = "Nhạy cảm"; }
    else if (normalized.contains("hon hop"))  { attrName = "Loại da"; attrVal = "Hỗn hợp"; }
    else if (normalized.contains("thuong"))   { attrName = "Loại da"; attrVal = "Thường"; }

    // ===== 4) Keyword =====
    String cleaned = normalized
        .replaceAll("(tu|từ|den|đến|duoi|dưới|tren|trên|tam|khoang|khoang gia|tam gia|gia|vnd|vnđ|dong|đ|d)", " ")
        .replaceAll("\\d+[\\dkm\\.\\s]*", " ")
        .replaceAll("\\s+", " ")
        .trim();
    Set<String> stops = Set.of("goi","goi y","tu van","minh","cho","xin","muon","can","hoac");
    StringBuilder kw = new StringBuilder();
    if (!cleaned.isBlank()) {
      for (String w : cleaned.split("\\s+")) {
        if (w.length() <= 1 || stops.contains(w)) continue;
        if (kw.length() > 0) kw.append(' ');
        kw.append(w);
      }
    }
    String keyword = kw.length() == 0 ? null : kw.toString();

    return new ParsedSlots(keyword, categoryId, catSlug, null, min, max, categoryName, attrName, attrVal);
  }

  private static final Map<String, String> CATEGORY_SYNONYM_TO_SLUG = Map.ofEntries(
      Map.entry("sua rua mat", "sua-rua-mat"),
      Map.entry("cleanser", "sua-rua-mat"),
      Map.entry("toner", "toner"),
      Map.entry("nuoc hoa hong", "toner"),
      Map.entry("serum", "serum"),
      Map.entry("tinh chat", "serum"),
      Map.entry("kem duong", "kem-duong"),
      Map.entry("duong am", "kem-duong"),
      Map.entry("chong nang", "chong-nang"),
      Map.entry("sunscreen", "chong-nang"),
      Map.entry("mat na", "mat-na"),
      Map.entry("mask", "mat-na"),
      Map.entry("son moi", "son-moi"),
      Map.entry("son bong", "son-moi"),
      Map.entry("lip gloss", "son-moi"),
      Map.entry("kem nen", "kem-nen"),
      Map.entry("foundation", "kem-nen")
  );

  private boolean withinPriceCard(Map<String,Object> card, Integer min, Integer max){
    if (min == null && max == null) return true;
    Long sale = asLong(card.get("salePrice"));
    Long price = asLong(card.get("price"));
    long eff = (sale != null) ? sale : (price == null ? 0L : price);
    if (min != null && eff < min) return false;
    if (max != null && eff > max) return false;
    return true;
  }

  private Long asLong(Object o){
    if (o == null) return null;
    if (o instanceof Number n) return n.longValue();
    try { return Long.valueOf(String.valueOf(o)); } catch(Exception e){ return null; }
  }

  private String detectCategorySlug(String normalized){
    for (var e : CATEGORY_SYNONYM_TO_SLUG.entrySet()) {
      if (normalized.contains(e.getKey())) return e.getValue();
    }
    return null;
  }

  private static String normalizeVi(String s) {
    if (s == null) return "";
    String norm = Normalizer.normalize(s, Normalizer.Form.NFD);
    return norm.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
               .replaceAll("[^\\p{L}\\p{N}\\s]", "")
               .toLowerCase();
  }

  private Integer parseMoney(String raw){
    if (raw == null) return null;
    String s = raw.replaceAll("[^0-9kKmM]", "").toLowerCase(Locale.ROOT);
    if (s.isEmpty()) return null;
    if (s.endsWith("k")) return Integer.parseInt(s.substring(0, s.length()-1)) * 1_000;
    if (s.endsWith("m")) return Integer.parseInt(s.substring(0, s.length()-1)) * 1_000_000;
    return Integer.parseInt(s);
  }

  // --------- intent helpers ----------
  private boolean isGenericSuggestIntent(String raw){
    if (raw == null) return true;
    String s = normalizeVi(raw);
    if (isGreeting(s)) return false; // lời chào không phải intent gợi ý
    return s.isBlank()
        || s.contains("goi y")
        || s.contains("goi san pham")
        || s.contains("goi y san pham")
        || s.contains("de xuat")
        || s.contains("tu van")
        || s.contains("recommend")
        || s.contains("suggest");
  }

  private boolean isGreeting(String s){
    if (s == null) return false;
    s = normalizeVi(s).trim();
    return s.matches("^(hi|hello|helo|hey|yo|alo|chao|xin chao)+.*");
  }

  // --------- logging helpers ----------
  private void saveLog(String role, String message, String sourcesJson){
    try{
      ChatLog log = new ChatLog();
      String sid = Optional.ofNullable(currentSessionId()).orElseGet(() -> UUID.randomUUID().toString());
      log.setSessionId(sid);
      log.setUserId(currentUserId());
      log.setRole(role);
      log.setMessage(message);
      log.setSourcesJson(sourcesJson);
      chatLogRepo.save(log);
    }catch(Exception ignore){}
  }

  private String jsonSafe(Object o){
    try { return (o==null) ? null : om.writeValueAsString(o); }
    catch (Exception e) { return null; }
  }

  private String currentSessionId(){
    try {
      var attrs = RequestContextHolder.getRequestAttributes();
      if (attrs instanceof ServletRequestAttributes sra) {
        var req = sra.getRequest();
        String sid = req.getHeader("X-Chat-Session");
        if (sid != null && !sid.isBlank()) return sid;
      }
    } catch (Exception ignore) {}
    return null;
  }

  private Long currentUserId(){ return null; } // tuỳ bạn tích hợp SecurityContext

  // --------- ParsedSlots ---------
  private record ParsedSlots(
      String keyword, Long categoryId, String catSlug, List<Long> childIds,
      Integer priceMin, Integer priceMax, String categoryName,
      String attrName, String attrVal
  ){
    ParsedSlots withPriceMin(Integer v){ return new ParsedSlots(keyword, categoryId, catSlug, childIds, v, priceMax, categoryName, attrName, attrVal); }
    ParsedSlots withPriceMax(Integer v){ return new ParsedSlots(keyword, categoryId, catSlug, childIds, priceMin, v, categoryName, attrName, attrVal); }
    ParsedSlots withCategoryName(String name){ return new ParsedSlots(keyword, categoryId, catSlug, childIds, priceMin, priceMax, name, attrName, attrVal); }
  }
}
