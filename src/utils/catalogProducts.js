const images = {
    seeds: [
        'photo-1574323347407-f5e1ad6d020b',
        'photo-1560493676-04071c5f467b',
        'photo-1551754655-cd27e38d2076',
        'photo-1542838132-92c53300491e',
        'photo-1523348837708-15d4a09cfac2',
        'photo-1464226184884-fa280b87c399',
        'photo-1500382017468-9049fed747ef',
        'photo-1574943320219-553eb213f72d',
        'photo-1416879595882-3373a0480b5b',
        'photo-1501004318641-b39e6451bec6'
    ],
    crops: [
        'photo-1416879595882-3373a0480b5b',
        'photo-1464226184884-fa280b87c399',
        'photo-1500382017468-9049fed747ef',
        'photo-1542838132-92c53300491e',
        'photo-1501004318641-b39e6451bec6',
        'photo-1560493676-04071c5f467b',
        'photo-1574323347407-f5e1ad6d020b',
        'photo-1523348837708-15d4a09cfac2',
        'photo-1551754655-cd27e38d2076',
        'photo-1497250681960-ef046c08a56e'
    ],
    agriShop: [
        'photo-1574943320219-553eb213f72d',
        'photo-1416879595882-3373a0480b5b',
        'photo-1500382017468-9049fed747ef',
        'photo-1464226184884-fa280b87c399',
        'photo-1551754655-cd27e38d2076',
        'photo-1542838132-92c53300491e',
        'photo-1501004318641-b39e6451bec6',
        'photo-1523348837708-15d4a09cfac2',
        'photo-1560493676-04071c5f467b',
        'photo-1587049352851-8d4e89133924'
    ],
    medicine: [
        'photo-1587049352851-8d4e89133924',
        'photo-1501004318641-b39e6451bec6',
        'photo-1497250681960-ef046c08a56e',
        'photo-1416879595882-3373a0480b5b',
        'photo-1542838132-92c53300491e',
        'photo-1464226184884-fa280b87c399',
        'photo-1500382017468-9049fed747ef',
        'photo-1523348837708-15d4a09cfac2',
        'photo-1560493676-04071c5f467b',
        'photo-1574323347407-f5e1ad6d020b'
    ],
    fertilizers: [
        'photo-1416879595882-3373a0480b5b',
        'photo-1464226184884-fa280b87c399',
        'photo-1500382017468-9049fed747ef',
        'photo-1501004318641-b39e6451bec6',
        'photo-1574323347407-f5e1ad6d020b',
        'photo-1551754655-cd27e38d2076',
        'photo-1542838132-92c53300491e',
        'photo-1523348837708-15d4a09cfac2',
        'photo-1560493676-04071c5f467b',
        'photo-1587049352851-8d4e89133924'
    ]
}

function makeProducts(section, category, products) {
    return products.map(([name, price, stock, packSize, unit, details], index) => ({
        id: `catalog-${section}-${index + 1}`,
        name,
        category,
        sections: [section],
        price,
        stock,
        packSize,
        unit,
        details,
        usage: 'Read and follow the instructions on the product packaging. Store in a cool, dry place.',
        image: `https://images.unsplash.com/${images[section][index]}?auto=format&fit=crop&w=800&q=82`,
        rating: '4.8',
        reviews: 0,
        badge: category
    }))
}

export const catalogProducts = [
    ...makeProducts('seeds', 'Seeds', [
        ['Hybrid Maize Seeds', 2850, 48, 5, 'kg', 'Hybrid maize seed selected for strong germination and a healthy crop stand.'],
        ['Premium Wheat Seeds', 3200, 35, 10, 'kg', 'Clean wheat seed suitable for seasonal planting and reliable establishment.'],
        ['Basmati Rice Seeds', 4600, 28, 5, 'kg', 'Basmati rice seed for growers looking for aromatic long-grain harvests.'],
        ['Hybrid Tomato Seeds', 1850, 60, 100, 'gram', 'Vegetable seed for home gardens and commercial tomato growing.'],
        ['Green Chilli Seeds', 1250, 55, 100, 'gram', 'Chilli seed for a productive garden or vegetable plot.'],
        ['Cucumber Seeds', 980, 42, 100, 'gram', 'Cucumber seed for warm-season kitchen gardens and farms.'],
        ['Onion Seeds', 1450, 38, 250, 'gram', 'Onion seed for nursery raising and seasonal field planting.'],
        ['Sunflower Seeds', 2100, 30, 2, 'kg', 'Sunflower seed for oilseed production and farm diversification.'],
        ['Fodder Maize Seeds', 1750, 44, 5, 'kg', 'Fodder maize seed for growing fresh feed for livestock.'],
        ['Okra Seeds', 850, 50, 250, 'gram', 'Okra seed suited to warm weather sowing and home vegetable gardens.']
    ]),
    ...makeProducts('crops', 'Crop Products', [
        ['NPK 20-20-20 Plant Food', 2450, 40, 1, 'kg', 'Balanced water-soluble plant food for supporting leafy growth, roots, and flowering.'],
        ['Organic Vermicompost', 950, 65, 5, 'kg', 'Organic compost to improve soil texture and support healthy root development.'],
        ['Potash Fertilizer', 1850, 36, 5, 'kg', 'Potassium fertilizer for crop nutrition during key growth stages.'],
        ['DAP Fertilizer Pack', 2950, 32, 5, 'kg', 'Phosphorus-rich fertilizer for supporting early root growth.'],
        ['Urea Fertilizer Pack', 1650, 50, 5, 'kg', 'Nitrogen fertilizer for supporting vegetative crop growth.'],
        ['Humic Acid Soil Conditioner', 1250, 45, 1, 'litre', 'Soil conditioner to support soil structure and nutrient availability.'],
        ['Seaweed Plant Tonic', 1100, 42, 500, 'ml', 'Plant tonic for use as part of a balanced crop nutrition programme.'],
        ['Calcium Boron Nutrient', 1350, 34, 1, 'litre', 'Calcium and boron foliar nutrient for use at suitable crop growth stages.'],
        ['Zinc Sulphate', 980, 48, 1, 'kg', 'Micronutrient source for crops where zinc is needed according to soil or crop advice.'],
        ['Organic Soil Booster', 750, 58, 2, 'kg', 'Organic soil amendment for garden beds and small farm plots.']
    ]),
    ...makeProducts('fertilizers', 'Fertilizer', [
        ['Urea Fertilizer 5 kg', 1650, 50, 5, 'kg', 'Nitrogen fertilizer for labelled crops. Use only at the rate recommended for your crop and soil.'],
        ['DAP Fertilizer 5 kg', 2950, 32, 5, 'kg', 'Phosphorus-rich fertilizer for supporting early root growth in suitable crops.'],
        ['NPK 20-20-20 Fertilizer', 2450, 40, 1, 'kg', 'Balanced water-soluble NPK fertilizer for use according to crop needs and label directions.'],
        ['Potash Fertilizer 5 kg', 1850, 36, 5, 'kg', 'Potassium fertilizer for crop nutrition at suitable growth stages.'],
        ['NPK 15-15-15 Fertilizer', 2150, 34, 5, 'kg', 'Balanced granular fertilizer for general crop nutrition. Check soil needs before application.'],
        ['Ammonium Sulphate 5 kg', 1380, 30, 5, 'kg', 'Nitrogen and sulphur fertilizer for labelled uses and appropriate soil conditions.'],
        ['Zinc Sulphate 1 kg', 980, 48, 1, 'kg', 'Zinc micronutrient fertilizer for crops where deficiency is confirmed or recommended.'],
        ['Organic Vermicompost 5 kg', 950, 65, 5, 'kg', 'Organic compost to improve soil texture and support root development.'],
        ['Humic Acid Fertilizer 1 L', 1250, 45, 1, 'litre', 'Liquid soil conditioner to support soil structure and nutrient availability.'],
        ['Calcium Nitrate Fertilizer', 1750, 25, 2, 'kg', 'Calcium and nitrogen source for labelled crops. Follow crop-specific directions.']
    ]),
    ...makeProducts('agriShop', 'Farming Tools', [
        ['Steel Garden Spade', 1850, 24, 1, 'piece', 'Durable hand spade for digging, turning soil, and preparing planting beds.'],
        ['Hand Pruning Shears', 1250, 30, 1, 'piece', 'Hand pruners for trimming stems and maintaining garden plants.'],
        ['Manual Seed Planter', 3200, 14, 1, 'piece', 'Manual planter to help place seeds evenly in small plots.'],
        ['Pressure Sprayer 5 L', 2450, 20, 5, 'litre', 'Handheld pressure sprayer for applying water or approved farm solutions.'],
        ['Garden Hoe', 1100, 27, 1, 'piece', 'Everyday hoe for weeding and loosening soil around plants.'],
        ['Watering Can 10 L', 950, 33, 10, 'litre', 'Large-capacity watering can for gardens, nurseries, and small farms.'],
        ['Harvesting Sickle', 780, 40, 1, 'piece', 'Hand sickle for harvesting and trimming suitable crops.'],
        ['Soil pH Test Meter', 2850, 12, 1, 'piece', 'Basic soil pH meter for checking growing media before planting.'],
        ['Drip Irrigation Starter Kit', 4500, 10, 1, 'piece', 'Starter drip kit for efficient watering in small gardens and growing beds.'],
        ['Protective Gardening Gloves', 650, 46, 1, 'pair', 'Reusable gloves to help protect hands during routine farm and garden work.']
    ]),
    ...makeProducts('medicine', 'Crop medicines', [
        ['Neem Oil Plant Spray', 950, 38, 500, 'ml', 'Neem-based plant care spray. Check the label and test on a small area before use.'],
        ['Copper Fungicide', 1450, 25, 500, 'gram', 'Copper-based crop protection product. Use only for labelled crops and follow all safety directions.'],
        ['Sulphur Fungicide', 1150, 28, 1, 'kg', 'Sulphur-based crop treatment for labelled uses. Follow the package directions carefully.'],
        ['Insect Monitoring Traps', 680, 52, 10, 'piece', 'Sticky monitoring traps to help observe flying insect activity in crop areas.'],
        ['Bio Insect Control', 1650, 20, 250, 'ml', 'Biological crop-care product. Verify crop compatibility and follow label instructions.'],
        ['Seed Treatment Solution', 1250, 24, 250, 'ml', 'Seed treatment product for labelled crops. Wear protective equipment as directed.'],
        ['Plant Disease Care Spray', 980, 32, 500, 'ml', 'Plant disease care product for labelled uses; follow label dosage and precautions.'],
        ['Yellow Sticky Pest Cards', 550, 60, 20, 'piece', 'Sticky cards for monitoring common flying pests in greenhouses and gardens.'],
        ['Crop Protection Dust', 850, 26, 500, 'gram', 'Crop protection dust for labelled applications. Keep away from children and animals.'],
        ['Plant Recovery Tonic', 780, 35, 500, 'ml', 'General plant-care tonic for use as directed on the product label.']
    ])
]
