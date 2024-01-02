import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
  const completion = await openai.chat.completions.create({
    // messages: [
    //   {
    //     role: "system",
    //     content: "You are a nutritionist who provides estimates on the volume in cups of food items by converting from the mass in ounces, utilizing estimated density.",
    //   },
    //   { role: "user", content: "How many cups are 5.0 ounces of steamed green peas? Provide the output as a JSON." },
    // ],
    messages: [{ role: 'user', content: `As a dietitian, please draw a table to calculate line by line the
    energy (kcal)/carbohydrates (g)/lipids (g)/proteins (g) of the food items (raw, not
    cooked) used as ingredients in an "L&A chipotle glazed garlic roasted chicken" served for lunch in a cafeteria managed by Bon Appétit Management Company. In lieu of precise numbers, estimate the exact quantities of each ingredient and the effects of cooking processes to determine the energy (kcal)/carbohydrates (g)/lipids (g)/proteins (g) in a serving of L&A chipotle glazed garlic roasted chicken, as well as how many ounces would be in that serving size
    
    Keep your response brief, only providing the final numerical result of the analysis in a json file with the totals of energy (kcal)/carbohydrates (g)/lipids (g)/proteins (g) as well as the serving size.`}],
    /*messages: [
      {
        role: "system",
        content: "You are a dietitian who provides estimates on the energy (kcal)/carbohydrates (g)/lipids (g)/proteins (g) of the food items (raw, not cooked) used as ingredients. Additionally, you estimate the quantities of each of these ingredients to determine the final energy (kcal)/carbohydrates (g)/lipids (g)/proteins (g) in a serving of the final food item, given in a final JSON file.",
      },
      { role: "user", content: "For a L&A chipotle glazed garlic roasted chicken served for lunch in a cafeteria managed by Bon Appétit Management Company, what are the totals of energy (kcal)/carbohydrates (g)/lipids (g)/proteins (g) as well as the serving size? Provide your answer in JSON format." },
    ],*/
    model: "gpt-4-1106-preview",
    // model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" },
  });
  console.log(completion.choices[0].message.content);
}

main();