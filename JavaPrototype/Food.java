public class Food {
	private boolean available;
	private String name;
	private int maxPerDay;
	private String servingUnits;
	private float calories;
	private float fat;
	private float carbs;
	private float fiber;
	private float sugar;
	private float protein;
	private boolean vegetable;
	private boolean fruit;
	private boolean refrigerated;

	public Food(boolean vail, String noam, int macks, String units, float cals, float faht, float cahbs, float faiba,
			float sugah, float rote, boolean vegeta, boolean fuit, boolean frige) {
		available = vail;
		name = noam;
		maxPerDay = macks;
		servingUnits = units;
		calories = cals;
		fat = faht;
		carbs = cahbs;
		fiber = faiba;
		sugar = sugah;
		protein = rote;
		vegetable = vegeta;
		fruit = fuit;
		refrigerated = frige;
	}

	public boolean isAvailable() {
		return available;
	}

	public void setAvailable(boolean vail) {
		available = vail;
	}

	public String getName() {
		return name;
	}

	public int getMaxPerDay() {
		return maxPerDay;
	}

	public String getServingUnits() {
		return servingUnits;
	}

	public void setServingUnits(String units) {
		servingUnits = units;
	}

	public float getCalories() {
		return calories;
	}

	public float getFat() {
		return fat;
	}

	public float getCarbs() {
		return carbs;
	}

	public float getFiber() {
		return fiber;
	}

	public float getSugar() {
		return sugar;
	}

	public float getProtein() {
		return protein;
	}

	public boolean isVegetable() {
		return vegetable;
	}

	public boolean isFruit() {
		return fruit;
	}

	public boolean isRefrigerated() {
		return refrigerated;
	}

	public void print() {
		System.out.println("available: " + available + "\nname: " + name + "\nmaxPerDay: " + maxPerDay
				+ "\nservingUnits: " + servingUnits + "\ncalories: " + calories + "\nfat: " + fat + "\ncarbs: " + carbs
				+ "\nfiber: " + fiber + "\nsugar: " + sugar + "\nprotein: " + protein + "\nvegetable: " + vegetable
				+ "\nfruit: " + fruit + "\n");
	}

	public String toString() {
		return available + "\n" + name + "\n" + maxPerDay + "\n" + servingUnits + "\n" + calories + "\n " + fat + "\n "
				+ carbs + "\n" + fiber + "\n" + sugar + "\n" + protein + "\n" + vegetable + "\n" + fruit + "\n"
				+ refrigerated + "\n";
	}
}