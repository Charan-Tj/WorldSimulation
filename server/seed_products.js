const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for Seeding'))
  .catch(err => console.log(err));

const realProducts = [
  // Groceries
  { name: "Aashirvaad Whole Wheat Atta (5kg)", category: "Groceries", price: 245, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Wheat_Flour.jpg/800px-Wheat_Flour.jpg" },
  { name: "Amul Salted Butter (500g)", category: "Groceries", price: 285, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Western-pack-butter.jpg/800px-Western-pack-butter.jpg" },
  { name: "Tata Salt (1kg)", category: "Groceries", price: 28, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Salt_shaker_on_white_background.jpg/800px-Salt_shaker_on_white_background.jpg" },
  { name: "Maggi 2-Minute Noodles (Pack of 12)", category: "Groceries", price: 168, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mama_instant_noodle_block.jpg/800px-Mama_instant_noodle_block.jpg" },
  { name: "Fortune Sunlite Refined Sunflower Oil (1L)", category: "Groceries", price: 145, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Sunflower_oil_and_sunflower.jpg/800px-Sunflower_oil_and_sunflower.jpg" },
  { name: "India Gate Basmati Rice (5kg)", category: "Groceries", price: 899, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Basmati_Rice_Variety.jpg/800px-Basmati_Rice_Variety.jpg" },
  { name: "Surf Excel Matic Liquid (2L)", category: "Groceries", price: 430, image: "https://placehold.co/600x400?text=Surf+Excel+Liquid" },
  { name: "Brooke Bond Red Label Tea (500g)", category: "Groceries", price: 230, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Tea_leaves_steeping_in_a_zhong_%E8%8C%B6.jpg/800px-Tea_leaves_steeping_in_a_zhong_%E8%8C%B6.jpg" },
  { name: "Kissan Mixed Fruit Jam (500g)", category: "Groceries", price: 160, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Strawberries_and_jam.jpg/800px-Strawberries_and_jam.jpg" },
  { name: "Kellogg's Corn Flakes (475g)", category: "Groceries", price: 320, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Cornflakes_in_bowl.jpg/800px-Cornflakes_in_bowl.jpg" },

  // Electronics
  { name: "boAt Airdopes 141", category: "Electronics", price: 1299, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/TWS_Earbuds.jpg/800px-TWS_Earbuds.jpg" },
  { name: "OnePlus Nord CE 3 Lite 5G", category: "Electronics", price: 19999, image: "https://placehold.co/600x400?text=OnePlus+Nord" },
  { name: "Logitech B170 Wireless Mouse", category: "Electronics", price: 595, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Red_computer_mouse.jpg/800px-Red_computer_mouse.jpg" },
  { name: "Samsung 24-inch Curved Monitor", category: "Electronics", price: 10499, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Computer_monitor.jpg/800px-Computer_monitor.jpg" },
  { name: "Sony WH-CH520 Headphones", category: "Electronics", price: 4490, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Headphones_1.jpg/800px-Headphones_1.jpg" },
  { name: "JBL Flip 6 Bluetooth Speaker", category: "Electronics", price: 9999, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/JBL_Flip_3.jpg/800px-JBL_Flip_3.jpg" },
  { name: "Mi Power Bank 3i 20000mAh", category: "Electronics", price: 2149, image: "https://placehold.co/600x400?text=Mi+Power+Bank" },
  { name: "Apple AirTag", category: "Electronics", price: 3490, image: "https://placehold.co/600x400?text=Apple+AirTag" },
  { name: "HP Pen Drive 64GB", category: "Electronics", price: 450, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/SanDisk_Cruzer_Micro_USB_Flash_Drive.jpg/800px-SanDisk_Cruzer_Micro_USB_Flash_Drive.jpg" },
  { name: "TP-Link N300 WiFi Router", category: "Electronics", price: 1099, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Wifi_router.jpg/800px-Wifi_router.jpg" },

  // Medicine
  { name: "Dolo 650 (Strip of 15)", category: "Medicine", price: 30, image: "https://placehold.co/600x400?text=Dolo+650" },
  { name: "Vicks VapoRub (50g)", category: "Medicine", price: 145, image: "https://placehold.co/600x400?text=Vicks+VapoRub" },
  { name: "Dettol Antiseptic Liquid (550ml)", category: "Medicine", price: 196, image: "https://placehold.co/600x400?text=Dettol+Antiseptic" },
  { name: "Crocin Pain Relief", category: "Medicine", price: 55, image: "https://placehold.co/600x400?text=Crocin+Pain+Relief" },
  { name: "Digene Gel (200ml)", category: "Medicine", price: 120, image: "https://placehold.co/600x400?text=Digene+Gel" },
  { name: "Revital H (Capsules)", category: "Medicine", price: 300, image: "https://placehold.co/600x400?text=Revital+H" },
  { name: "Dabur Chyawanprash (1kg)", category: "Medicine", price: 375, image: "https://placehold.co/600x400?text=Dabur+Chyawanprash" },
  { name: "Volini Pain Relief Spray", category: "Medicine", price: 160, image: "https://placehold.co/600x400?text=Volini+Spray" },
  { name: "Hansaplast Bandage (Box)", category: "Medicine", price: 50, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Bandages.jpg/800px-Bandages.jpg" },
  { name: "Ensure Health Drink (Vanilla)", category: "Medicine", price: 650, image: "https://placehold.co/600x400?text=Ensure+Health+Drink" },

  // Food
  { name: "Hyderabadi Chicken Biryani", category: "Food", price: 350, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/\"Hyderabadi_Dum_Biryani\".jpg/800px-\"Hyderabadi_Dum_Biryani\".jpg" },
  { name: "Paneer Butter Masala", category: "Food", price: 280, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Paneer_Butter_Masala_02.jpg/800px-Paneer_Butter_Masala_02.jpg" },
  { name: "Chicken 65", category: "Food", price: 290, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Chicken_65_Dish.jpg/800px-Chicken_65_Dish.jpg" },
  { name: "Veg Burger", category: "Food", price: 120, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Hamburger_%28black_bg%29.jpg/800px-Hamburger_%28black_bg%29.jpg" },
  { name: "Margherita Pizza (Medium)", category: "Food", price: 399, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg/800px-Eq_it-na_pizza-margherita_sep2005_sml.jpg" },
  { name: "Masala Dosa", category: "Food", price: 90, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Dosa_at_Sri_Ganesha_Restauran%2C_Bangkok_%2844570742744%29.jpg/800px-Dosa_at_Sri_Ganesha_Restauran%2C_Bangkok_%2844570742744%29.jpg" },
  { name: "Coca Cola (750ml)", category: "Food", price: 45, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/15-09-26-RalfR-WLC-0098.jpg/800px-15-09-26-RalfR-WLC-0098.jpg" },
  { name: "Chocolate Brownie", category: "Food", price: 150, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Chocolatebrownie.JPG/800px-Chocolatebrownie.JPG" },
  { name: "French Fries", category: "Food", price: 110, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/French_Fries.JPG/800px-French_Fries.JPG" },
  { name: "Butter Naan", category: "Food", price: 40, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Naan_shiva.jpg/800px-Naan_shiva.jpg" }
];

// Fill up to 50 with duplicates if needed, or just use these 40 high quality ones.
// User asked for 50, let's add a few more generic ones to hit 50.
const extraProducts = [
  { name: "Oreo Biscuits", category: "Groceries", price: 30, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Oreo-Two-Cookies.jpg/800px-Oreo-Two-Cookies.jpg" },
  { name: "Lays Classic Salted", category: "Groceries", price: 20, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Lays_Classic_Chips.jpg/800px-Lays_Classic_Chips.jpg" },
  { name: "Red Bull Energy Drink", category: "Groceries", price: 125, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Red_Bull_Energy_Drink.jpg/800px-Red_Bull_Energy_Drink.jpg" },
  { name: "Apple iPhone 15", category: "Electronics", price: 79900, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/IPhone_15_Pro_Max_Blue_Titanium_1.jpg/800px-IPhone_15_Pro_Max_Blue_Titanium_1.jpg" },
  { name: "Dell XPS 13 Laptop", category: "Electronics", price: 120000, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Dell_XPS_15.jpg/800px-Dell_XPS_15.jpg" },
  { name: "Combiflam", category: "Medicine", price: 40, image: "https://placehold.co/600x400?text=Combiflam" },
  { name: "Benadryl Cough Syrup", category: "Medicine", price: 110, image: "https://placehold.co/600x400?text=Benadryl" },
  { name: "Veg Momos", category: "Food", price: 120, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Momo_nepal.jpg/800px-Momo_nepal.jpg" },
  { name: "Pav Bhaji", category: "Food", price: 140, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Pav_Bhaji_at_Mumba.jpg/800px-Pav_Bhaji_at_Mumba.jpg" },
  { name: "Gulab Jamun", category: "Food", price: 80, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Gulab_Jamun_in_Bowl.jpg/800px-Gulab_Jamun_in_Bowl.jpg" }
];

const allProducts = [...realProducts, ...extraProducts];

const seedDB = async () => {
  await Product.deleteMany({});
  await Product.insertMany(allProducts);
  console.log(`Seeded ${allProducts.length} real products`);
  mongoose.connection.close();
};

seedDB();
