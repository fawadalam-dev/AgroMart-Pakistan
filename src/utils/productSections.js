const legacySectionByCategory = {
    Seeds: 'seeds',
    'Crop medicines': 'medicine',
    'Strength medicines': 'medicine',
    Fertilizer: 'medicine',
    'Farming Tools': 'agriShop',
    'Safety Gear': 'agriShop'
}

export function belongsToSection(product, section) {
    if (Array.isArray(product.sections) && product.sections.length) return product.sections.includes(section)
    return (legacySectionByCategory[product.category] || 'crops') === section
}
