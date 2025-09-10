package com.shopmypham.modules.product;
import com.shopmypham.core.api.ApiResponse;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/products")
public class ProductController {
  @GetMapping("/ping") public ApiResponse<String> ping(){
    return new ApiResponse<>(true,"product-ok",null);
  }
}
