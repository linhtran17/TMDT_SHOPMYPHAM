INSERT INTO roles(name)
VALUES ('ROLE_ADMIN'), ('ROLE_USER')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO categories (name, slug, active)
VALUES ('Son môi', 'son-moi', 1),
       ('Sữa rửa mặt', 'sua-rua-mat', 1),
       ('Serum', 'serum', 1)
ON DUPLICATE KEY UPDATE slug = VALUES(slug);

INSERT INTO products (name, description, price, in_stock, stock_qty, category_id, best_seller)
SELECT 'Son đỏ A','Lì, lâu trôi',199000,1,100,c.id,1
FROM categories c WHERE c.slug='son-moi'
ON DUPLICATE KEY UPDATE price=VALUES(price);
