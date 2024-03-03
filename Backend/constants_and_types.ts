export const archivedBonSite: string = "files/old_bon_site.html";
export enum foodTier {
    Special = 0,
    Additional,
    Condiment
}
type Food = {    
    "id": number,
    "label": string,
    "description": string,
    "short_name": string,
    "raw_cooked": number,
    "meal":string,
    "tier":foodTier,
    "nutritionless":boolean,
    "artificial_nutrition":boolean,
    "nutrition": {
        "kcal": number,
        "well_being": number,
    },
    "vegetarian":boolean,
    "vegan":boolean,
    "glutenfree":boolean,
    "station_id": number,
    "station": string,
    "nutrition_details": nutritionDetails,
    "ingredients": string[],
    "sub_station_id": number,
    "sub_station": string,
    "sub_station_order": number,
    "monotony": {}
}
type FoodSquare = {
    food:any, /* Would be Food type, but string stuff */
    required:boolean,
    banned:boolean,
    quantity:number
}
type nutritionDetails = {
    "calories": {
        "value": number,
        "unit": string
    },
    "servingSize": {
        "value": number,
        "unit": string
    },
    "fatContent": {
        "value": number,
        "unit": string
    },
    "carbohydrateContent": {
        "value": number,
        "unit": string
    },
    "proteinContent": {
        "value": number,
        "unit": string
    }
}

export { Food }
export { FoodSquare }
export { nutritionDetails }