package com.shopmypham.modules.inventory;

public enum InventoryReason {
  purchase,         // nhập hàng từ NCC
  purchase_return,  // trả hàng NCC
  order,            // bán ra (xuất)
  refund,           // khách trả hàng
  adjustment,       // điều chỉnh tồn
  manual,           // thủ công khác
  initial,          // tồn đầu kỳ
  cancel            // huỷ chứng từ / đơn
}
