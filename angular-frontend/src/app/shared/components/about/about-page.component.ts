import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
  <section class="relative bg-gradient-to-b from-pink-50 to-white py-20">
    <div class="container mx-auto max-w-5xl px-6 text-center space-y-14">
      
      <!-- Tiêu đề thương hiệu -->
      <div>
        <h1 class="text-6xl font-extrabold tracking-wide text-pink-600 mb-4">
          L’Éclat ✨
        </h1>
        <p class="text-2xl text-gray-700 italic">
          Hào quang rạng rỡ – Nơi vẻ đẹp thăng hoa
        </p>
      </div>

      <!-- Câu chuyện thương hiệu -->
      <div class="space-y-6 text-lg text-gray-700 leading-relaxed text-justify">
        <p>
          <strong>L’Éclat</strong>, trong tiếng Pháp, mang ý nghĩa <em>“hào quang, sự rạng rỡ”</em>. 
          Đó không chỉ là một cái tên, mà còn là lời hứa, là tầm nhìn và là triết lý sống: 
          <span class="font-medium text-pink-500">mỗi người phụ nữ đều xứng đáng được toả sáng, 
          theo cách riêng của mình</span>. 
          Chính khát khao ấy đã thôi thúc chúng tôi xây dựng thương hiệu mỹ phẩm 
          mang đến sự tự tin, niềm vui và ánh sáng cho hàng triệu khách hàng.
        </p>

        <p>
          Ra đời với sứ mệnh <span class="underline decoration-pink-400">lan toả vẻ đẹp đích thực</span>, 
          L’Éclat lựa chọn hợp tác với những thương hiệu mỹ phẩm hàng đầu thế giới, 
          đảm bảo mọi sản phẩm đến tay khách hàng đều 
          <span class="font-semibold">chính hãng – an toàn – chất lượng</span>. 
          Từ các dòng skincare giúp phục hồi làn da, đến makeup tôn vinh đường nét, 
          chúng tôi đều đặt trọn tâm huyết trong từng lựa chọn.
        </p>
      </div>

      <!-- Giá trị cốt lõi -->
      <div class="bg-white rounded-2xl shadow-lg px-8 py-10 text-left space-y-6">
        <h2 class="text-3xl font-bold text-pink-600 text-center mb-4">Giá trị cốt lõi</h2>
        <ul class="list-disc list-inside text-gray-800 space-y-3">
          <li>
            <strong>Chính trực & Niềm tin:</strong> Chỉ cung cấp <span class="text-pink-500">100% hàng thật</span>, 
            nói không với hàng giả, để khách hàng luôn yên tâm tuyệt đối.
          </li>
          <li>
            <strong>Tận tâm & Gần gũi:</strong> Đội ngũ tư vấn am hiểu sản phẩm, sẵn sàng đồng hành, 
            thấu hiểu và hỗ trợ bạn trên hành trình làm đẹp.
          </li>
          <li>
            <strong>Sáng tạo & Trải nghiệm:</strong> Không chỉ là mua sắm, 
            mà là <span class="italic">hành trình tận hưởng</span>, với 
            giao diện hiện đại, giao hàng nhanh chóng và chính sách 
            <span class="underline decoration-pink-400">đổi trả trong 7 ngày</span>.
          </li>
          <li>
            <strong>Ưu đãi & Giá trị:</strong> Chúng tôi mang đến các chương trình 
            <span class="font-medium">ưu đãi mỗi ngày</span> để bạn vừa đẹp, vừa tiết kiệm thông minh.
          </li>
        </ul>
      </div>

      <!-- Tầm nhìn và sứ mệnh -->
      <div class="space-y-6 text-lg text-gray-700 leading-relaxed text-justify">
        <p>
          Tầm nhìn của <strong>L’Éclat ✨</strong> là trở thành một trong những thương hiệu mỹ phẩm 
          được yêu thích nhất tại Việt Nam và vươn tầm quốc tế, 
          nơi mà phụ nữ không chỉ tìm thấy sản phẩm chăm sóc sắc đẹp, 
          mà còn tìm thấy <span class="font-medium text-pink-600">sự đồng cảm, sự tự tin và cảm hứng sống</span>.
        </p>

        <p>
          Chúng tôi tin rằng: <span class="italic">“Vẻ đẹp không chỉ đến từ làn da hoàn hảo, 
          mà còn từ ánh sáng tự tin tỏa ra từ bên trong.”</span>  
          Và sứ mệnh của chúng tôi là thắp sáng ánh hào quang ấy trong mỗi khách hàng.
        </p>

        <p>
          Mỗi sản phẩm bạn chọn từ L’Éclat không đơn thuần chỉ là mỹ phẩm – 
          mà là một phần trong hành trình biến đổi bản thân, 
          giúp bạn rạng rỡ hơn, tự tin hơn, và hạnh phúc hơn mỗi ngày.
        </p>
      </div>

      <!-- Tagline -->
      <div class="mt-14">
        <p class="text-2xl font-semibold text-pink-600">
          🌸 L’Éclat – Shine Your Beauty, Embrace Your Glow 🌸
        </p>
      </div>
    </div>
  </section>
  `
})
export class AboutPageComponent {}
