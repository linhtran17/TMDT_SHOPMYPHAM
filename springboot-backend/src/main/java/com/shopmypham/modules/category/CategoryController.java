package com.shopmypham.modules.category;
import com.shopmypham.core.api.ApiResponse;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/categories")
public class CategoryController {
  @GetMapping("/ping") public ApiResponse<String> ping(){
    return new ApiResponse<>(true,"category-ok",null);
  }
}
