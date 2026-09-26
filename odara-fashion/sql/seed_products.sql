-- Insert Categories
INSERT INTO categories (name) VALUES
('Fashion'),
('Fragrances'),
('Accessories')
ON CONFLICT DO NOTHING;

-- Insert Fashion Products (Abayas, Thoubs, Dresses, etc.)
INSERT INTO products (name, description, price, category, stock) VALUES
('Pearl Abaya', 'Elegant pearl abaya with subtle embroidery', 99.99, 'Fashion', 10),
('Layali Black Floral', 'Black abaya with delicate floral patterns', 119.99, 'Fashion', 8),
('Odara Midnight Elegance', 'Sophisticated midnight blue abaya', 89.99, 'Fashion', 12),
('Embroidered Two-Piece', 'Beautiful two-piece set with embroidery', 139.99, 'Fashion', 6),
('Lara Thoub', 'Flowing traditional thoub', 139.99, 'Fashion', 5),
('Atlas Thoub', 'Premium atlas thoub', 214.99, 'Fashion', 4),
('Safiya Thoub', 'Elegant Safiya design thoub', 189.99, 'Fashion', 7),
('Yaqoot Thoub', 'Rich Yaqoot colored thoub', 149.99, 'Fashion', 9),
('Pearl of Evening', 'Stunning pearl evening dress', 119.99, 'Fashion', 11),
('Sporty Chic', 'Comfortable sporty chic dress', 109.99, 'Fashion', 14),
('Amara Dress', 'Beautiful Amara dress collection', 140.00, 'Fashion', 8),
('Princess Kaftan', 'Luxurious princess kaftan', 229.99, 'Fashion', 3),
('Maysaa Kaftan', 'Elegant Maysaa kaftan', 139.99, 'Fashion', 5),
('Embroidered Jacket', 'Intricately embroidered jacket', 169.99, 'Fashion', 7),
('Embroidered Chiffon Skirt', 'Light chiffon skirt with embroidery', 89.99, 'Fashion', 10),
('Shams', 'Radiant Shams collection piece', 219.99, 'Fashion', 4),
('Sanaa Skirt', 'Flowing Sanaa skirt', 59.99, 'Fashion', 15),
('Midnight Skirt', 'Elegant midnight skirt', 69.99, 'Fashion', 12),

-- Fragrances - Perfumes
('Oud Amara', 'Rich oud perfume with amber notes', 54.99, 'Fragrances', 20),
('Rose Garden', 'Floral rose perfume', 49.99, 'Fragrances', 25),
('Arabian Nights', 'Luxurious Arabian Nights fragrance', 59.99, 'Fragrances', 18),
('Jasmine Dream', 'Delicate jasmine perfume', 49.99, 'Fragrances', 22),

-- Fragrances - Oils
('Oud Pure', 'Pure oud oil', 34.99, 'Fragrances', 30),
('Floral Blend', 'Mixed floral oil blend', 29.99, 'Fragrances', 35),
('Sandalwood', 'Premium sandalwood oil', 29.99, 'Fragrances', 32),
('Amber Musk', 'Warm amber musk oil', 34.99, 'Fragrances', 28),
('Lavender', 'Pure lavender oil', 24.99, 'Fragrances', 40);
