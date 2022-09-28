import java.awt.Color;
import java.awt.GridLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Scanner;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JTextField;
import javax.swing.JOptionPane;
import java.io.FileWriter;
import java.io.IOException;

public class FoodStuff extends JFrame implements ActionListener, WindowListener, KeyListener {
	public static ArrayList<Food> available = new ArrayList<Food>();
	public static ArrayList<Food> mustHaves = new ArrayList<Food>();
	public static ArrayList<JButton> buttons = new ArrayList<JButton>();
	public static ArrayList<String> numMusts = new ArrayList<String>();
	public static JTextField numMust = new JTextField("==1");
	public static JButton maxDiversity = new JButton("Maximum Diversity");
	public static JLabel fruit = new JLabel();
	public static JButton resetFruit = new JButton("New Fruit");
	public static JLabel vegetable = new JLabel();
	public static JButton resetVegetable = new JButton("New Vegetable");
	public static JFrame frame = new JFrame("AddFood");
	public static JFrame fraem = new JFrame("RemoveFood");
	public static JTextField[] arr = { new JTextField("true"), new JTextField("ExampleFood(Acme)"), new JTextField("1"),
			new JTextField("1.0_pieces"), new JTextField("17.0"), new JTextField("1.0"), new JTextField("1.0"),
			new JTextField("0.5"), new JTextField("0.5"), new JTextField("1.0"), new JTextField("false"),
			new JTextField("false"), new JTextField("true") };
	public static JTextField toRemove = new JTextField("ExampleFood(Acme)");
	public static JButton flush = new JButton("Add");
	public static JButton plunge = new JButton("Remove");

	public FoodStuff() {
		frame.setSize(500, 500);
		frame.setLayout(new GridLayout(14, 2));
		frame.add(new JLabel("boolean available: "));
		frame.add(arr[0]);
		frame.add(new JLabel("String name: "));
		frame.add(arr[1]);
		frame.add(new JLabel("int maxPerDay: "));
		frame.add(arr[2]);
		frame.add(new JLabel("String servingUnits: "));
		frame.add(arr[3]);
		frame.add(new JLabel("float calories: "));
		frame.add(arr[4]);
		frame.add(new JLabel("float fat: "));
		frame.add(arr[5]);
		frame.add(new JLabel("float carbohydrate: "));
		frame.add(arr[6]);
		frame.add(new JLabel("float fiber: "));
		frame.add(arr[7]);
		frame.add(new JLabel("float sugar: "));
		frame.add(arr[8]);
		frame.add(new JLabel("float protein: "));
		frame.add(arr[9]);
		frame.add(new JLabel("boolean vegetable: "));
		frame.add(arr[10]);
		frame.add(new JLabel("boolean fruit: "));
		frame.add(arr[11]);
		frame.add(new JLabel("boolean refrigerated: "));
		frame.add(arr[12]);
		flush.addActionListener(this);
		frame.add(flush);
		frame.addWindowListener(this);
		frame.setVisible(true);
		fraem.setSize(500, 500);
		fraem.setLayout(new GridLayout(1, 2));
		plunge.addActionListener(this);
		fraem.add(plunge);
		fraem.add(toRemove);
		fraem.addWindowListener(this);
		fraem.setVisible(true);
		setLayout(new GridLayout(available.size() / 2, available.size() / 2));
		add(resetFruit);
		add(resetVegetable);
		add(maxDiversity);
		maxDiversity.addActionListener(this);
		int i = (int) (Math.random() * (available.size()));
		while (!available.get(i).isFruit() || !available.get(i).isAvailable()) {
			i = (int) (Math.random() * (available.size()));
		}
		fruit.setText(available.get(i).getName());
		i = (int) (Math.random() * (available.size()));
		while (!available.get(i).isVegetable() || !available.get(i).isAvailable()) {
			i = (int) (Math.random() * (available.size()));
		}
		vegetable.setText(available.get(i).getName());
		add(fruit);
		add(vegetable);
		numMust.setColumns(20);
		add(numMust);
		numMust.addKeyListener(this);
		resetFruit.addActionListener(this);
		resetVegetable.addActionListener(this);
		for (int j = 0; j < available.size(); j++) {
			buttons.add(new JButton(available.get(j).getName()));
			add(buttons.get(j));
			if (!available.get(j).isAvailable()) {
				buttons.get(j).setBackground(Color.red);
			} else {
				buttons.get(j).setBackground(Color.green);
			}
			buttons.get(j).addActionListener(this);
		}
		setSize(1000, 500);
		setTitle("MealMaker");
		setVisible(true);
		addWindowListener(this);
		String msg = " - Maximize console upon closing the main window.\n - Buttons change colors when clicked.\n - Green means the button's food is available, red means that the food is unavailable, and blue means the food needs to be part of the meal.\n - Any highlighted blue buttons will have their guaranteed nutrition calculated.\n - If you want to specify how much of your blue must-have foods, type >=, ==, or <=, the number in the provided field, and press enter (e.g. ==1).\n - >= means you want at least that number of that food, == means exactly that number, and <= means at most.\n - Turning this tile green again will allow you to modify the quantity of previous must-have foods.\n - Note that choosing a certain food isn't necessarily the serving size, but the minimum amount to be consumed alone (This also applies in the adding of new foods).\n - The Maximum Diversity button ensures that only one of each available food can be part of the meal (click it again to turn must-haves back to green again).\n - Meal generation can take up to a minute. If it exceeds this time, try adjusting your preferences and trying again.\n - The AddFood and RemoveFood windows allow you to add and remove new foods from your pantry on the spot.\n - You can also add, remove, or modify foods directly from Foodlist.txt";
		JOptionPane.showMessageDialog(null, msg, "Instructions", JOptionPane.INFORMATION_MESSAGE);
	}

	public static void main(String[] args) throws FileNotFoundException {
		File prevFoods = new File("src/Foodlist");
		Scanner scan = new Scanner(prevFoods);
		while (scan.hasNextLine()) {
			try {
				available.add(new Food(scan.nextBoolean(), scan.next(), scan.nextInt(), scan.next(), scan.nextFloat(),
						scan.nextFloat(), scan.nextFloat(), scan.nextFloat(), scan.nextFloat(), scan.nextFloat(),
						scan.nextBoolean(), scan.nextBoolean(), scan.nextBoolean()));
			} catch (Exception ie) {
				break;
			}
		}
		scan.close();
		new FoodStuff();
	}

	public static void makeMeal(int totalCalories, int fatPercentage, int carbPercentage, int fiberPercentage,
			int sugarPercentage, int proteinPercentage, int margin) {
		int mustHavesSize = 0;
		int numVeggies = 0;
		int numFruits = (int) (Math.ceil((totalCalories + .001) / 600.0));
		System.out.println("Meal Request: A meal with " + totalCalories + " calories, " + fatPercentage + "% fat, "
				+ carbPercentage + "% carbohydrate, " + fiberPercentage + "% fiber, " + sugarPercentage + "% sugar, "
				+ proteinPercentage + "% protein, and a " + margin + "% margin of error.");
		if (mustHaves.size() > 0) {
			System.out.print("Additionally, there must be");
			if (mustHaves.size() == 1) {
				if (numMusts.get(0).substring(0, 2).equals(">=")) {
					System.out.print(" at least");
				} else if (numMusts.get(0).substring(0, 2).equals("<=")) {
					System.out.print(" at most");
				} else {
					System.out.print(" exactly");
				}
				System.out.print(" "
						+ String.valueOf((Integer.parseInt(numMusts.get(0).substring(2))
								* Double.parseDouble(mustHaves.get(0).getServingUnits().substring(0,
										mustHaves.get(0).getServingUnits().indexOf("_")))))
						+ mustHaves.get(0).getServingUnits().substring(mustHaves.get(0).getServingUnits().indexOf("_"))
						+ " " + mustHaves.get(0).getName());
			} else if (mustHaves.size() == 2) {
				if (numMusts.get(0).substring(0, 2).equals(">=")) {
					System.out.print(" at least");
				} else if (numMusts.get(0).substring(0, 2).equals("<=")) {
					System.out.print(" at most");
				} else {
					System.out.print(" exactly");
				}
				System.out.print(" "
						+ String.valueOf((Integer.parseInt(numMusts.get(0).substring(2))
								* Double.parseDouble(mustHaves.get(0).getServingUnits().substring(0,
										mustHaves.get(0).getServingUnits().indexOf("_")))))
						+ mustHaves.get(0).getServingUnits().substring(mustHaves.get(0).getServingUnits().indexOf("_"))
						+ " " + mustHaves.get(0).getName() + " and");
				if (numMusts.get(1).substring(0, 2).equals(">=")) {
					System.out.print(" at least");
				} else if (numMusts.get(1).substring(0, 2).equals("<=")) {
					System.out.print(" at most");
				} else {
					System.out.print(" exactly");
				}
				System.out.print(" "
						+ String.valueOf((Integer.parseInt(numMusts.get(1).substring(2))
								* Double.parseDouble(mustHaves.get(1).getServingUnits().substring(0,
										mustHaves.get(1).getServingUnits().indexOf("_")))))
						+ mustHaves.get(1).getServingUnits().substring(mustHaves.get(1).getServingUnits().indexOf("_"))
						+ " " + mustHaves.get(1).getName());
			} else {
				for (int i = 0; i < mustHaves.size(); i++) {
					if (i < mustHaves.size() - 1) {
						if (numMusts.get(i).substring(0, 2).equals(">=")) {
							System.out.print(" at least");
						} else if (numMusts.get(i).substring(0, 2).equals("<=")) {
							System.out.print(" at most");
						} else {
							System.out.print(" exactly");
						}
						System.out.print(" "
								+ String.valueOf((Integer.parseInt(numMusts.get(i).substring(2))
										* Double.parseDouble(mustHaves.get(i).getServingUnits().substring(0,
												mustHaves.get(i).getServingUnits().indexOf("_")))))
								+ mustHaves.get(i).getServingUnits()
										.substring(mustHaves.get(i).getServingUnits().indexOf("_"))
								+ " " + mustHaves.get(i).getName() + ",");
					} else {
						if (numMusts.get(i).substring(0, 2).equals(">=")) {
							System.out.print(" and at least ");
						} else if (numMusts.get(i).substring(0, 2).equals("<=")) {
							System.out.print(" and at most ");
						} else {
							System.out.print(" and exactly ");
						}
						System.out.print(String
								.valueOf((Integer.parseInt(numMusts.get(i).substring(2))
										* Double.parseDouble(mustHaves.get(i).getServingUnits().substring(0,
												mustHaves.get(i).getServingUnits().indexOf("_")))))
								+ mustHaves.get(i).getServingUnits()
										.substring(mustHaves.get(i).getServingUnits().indexOf("_"))
								+ " " + mustHaves.get(i).getName());
					}
				}
			}
		} else {
			System.out.println();
		}
		float calories = 0;
		float carbs = 0;
		float protein = 0;
		float fat = 0;
		// Soluble is 2 calories per gram and insoluble is one calorie per gram, so 1
		// calorie per gram, ehh
		float fiber = 0;
		float sugar = 0;
		ArrayList<Food> chosen = new ArrayList<Food>();
		for (int i = 0; i < mustHaves.size(); i++) {
			if (numMusts.get(i).substring(0, 2).equals(">=") || numMusts.get(i).substring(0, 2).equals("==")) {
				for (int j = 0; j < Integer.parseInt(numMusts.get(i).substring(2)); j++) {
					mustHavesSize++;
					chosen.add(mustHaves.get(i));
					calories += mustHaves.get(i).getCalories();
					fat += mustHaves.get(i).getFat();
					carbs += mustHaves.get(i).getCarbs();
					fiber += mustHaves.get(i).getFiber();
					if (mustHaves.get(i).isFruit() && numFruits != 0) {
						numFruits--;
						sugar -= mustHaves.get(i).getSugar();
					}
					sugar += mustHaves.get(i).getSugar();
					protein += mustHaves.get(i).getProtein();
				}
			}
		}
		if (mustHaves.size() > 0) {
			System.out.println(
					", which totals " + (int) calories + " calories, " + ((int) (10 * 900 * fat / calories) / 10.0)
							+ "% fat, " + ((int) (10 * 400 * carbs / calories) / 10.0) + "% carbohydrate, "
							+ ((int) (10 * 100 * fiber / calories) / 10.0) + "% fiber, "
							+ ((int) (10 * 400 * sugar / calories) / 10.0) + "% sugar, and "
							+ ((int) (10 * 400 * protein / calories) / 10.0) + "% protein.\n");
		}
		int i = (int) (Math.random() * (available.size()));
		while (Math.abs(1 - calories / totalCalories) > ((float) margin / 100)
				|| (Math.abs(((float) fatPercentage / 100) - (9 * fat / totalCalories))) > ((float) margin / 100)
				|| (Math.abs(((float) carbPercentage / 100) - (4 * carbs / totalCalories))) > ((float) margin / 100)
				|| (Math.abs(((float) fiberPercentage / 100) - (1 * fiber / totalCalories))) > ((float) margin / 100)
				|| (Math.abs(((float) sugarPercentage / 100) - (4 * sugar / totalCalories))) > ((float) margin / 100)
				|| (Math.abs(((float) proteinPercentage / 100) - (4 * protein / totalCalories))) > ((float) margin
						/ 100)) {
			// Too nutritious
			if (calories > totalCalories || ((float) fatPercentage / 100) < (9 * fat / totalCalories)
					|| ((float) carbPercentage / 100) < (4 * carbs / totalCalories)
					|| ((float) fiberPercentage / 100) < (1 * fiber / totalCalories)
					|| ((float) sugarPercentage / 100) < (4 * sugar / totalCalories)
					|| ((float) proteinPercentage / 100) < (4 * protein / totalCalories)) {
				/*
				 * Random selection (as opposed to recursion), prevents stack overflow, since
				 * food lists can get super long
				 */
				i = ((int) (Math.random() * (chosen.size() - mustHavesSize))) + mustHavesSize;
				try {
					calories -= chosen.get(i).getCalories();
				} catch (Exception ie) {
					JOptionPane.showMessageDialog(null,
							"Required foods are too nutritious to make a meal of these specifications with.",
							"Invalid Base", JOptionPane.WARNING_MESSAGE);
					System.exit(0);
				}
				fat -= chosen.get(i).getFat();
				carbs -= chosen.get(i).getCarbs();
				fiber -= chosen.get(i).getFiber();
				sugar -= chosen.get(i).getSugar();
				protein -= chosen.get(i).getProtein();
				chosen.remove(i);
			} else {
				// Not nutritious enough
				i = (int) (Math.random() * (available.size()));
				int numI = 0;
				for (Food jay : chosen) {
					if (jay.getName().equals(available.get(i).getName())) {
						numI++;
					}
				}
				// This ensures that the allowable max is proportional to totalCalories, since
				// the food maximums are based on a whole day's calories (2000)
				if (((numI + 1) <= Math.round(totalCalories * available.get(i).getMaxPerDay() / 2000)
						&& !mustHaves.contains(available.get(i)))
						|| ((mustHaves.contains(available.get(i))) && ((numMusts
								.get(mustHaves.indexOf(available.get(i))).substring(0, 2).equals(">="))
								|| (numMusts.get(mustHaves.indexOf(available.get(i))).substring(0, 2).equals("<=")
										&& (numI + 1) <= Integer.parseInt(
												numMusts.get(mustHaves.indexOf(available.get(i))).substring(2)))))) {
					chosen.add(available.get(i));
					calories += available.get(i).getCalories();
					fat += available.get(i).getFat();
					carbs += available.get(i).getCarbs();
					fiber += available.get(i).getFiber();
					if (available.get(i).isFruit() && numFruits != 0) {
						numFruits--;
						sugar -= available.get(i).getSugar();
					}
					sugar += available.get(i).getSugar();
					protein += available.get(i).getProtein();
				}
			}
		}
		numVeggies = 0;
		numFruits = 0;
		ArrayList<Food> toPrint = new ArrayList<Food>();
		while (chosen.size() > 0) {
			Food name = chosen.remove(0);
			int numI = 1;
			if (name.isFruit()) {
				numFruits++;
			}
			if (name.isVegetable()) {
				numVeggies++;
			}
			for (int j = 0; j < chosen.size(); j++) {
				if (chosen.get(j).getName().equals(name.getName())) {
					chosen.remove(j);
					numI++;
					j--;
					if (name.isVegetable()) {
						numVeggies++;
					}
					if (name.isFruit()) {
						numFruits++;
					}
				}
			}
			name.setServingUnits(String
					.valueOf((numI * Double
							.parseDouble(name.getServingUnits().substring(0, name.getServingUnits().indexOf("_")))))
					+ name.getServingUnits().substring(name.getServingUnits().indexOf("_")));
			toPrint.add(name);
		}
		System.out.println("Meal: A meal " + numVeggies + " vegetable(s), " + numFruits + " fruit, " + (int) calories
				+ " calories, " + ((int) (10 * 900 * fat / calories) / 10.0) + "% fat, "
				+ ((int) (10 * 400 * carbs / calories) / 10.0) + "% carbohydrate, "
				+ ((int) (10 * 100 * fiber / calories) / 10.0) + "% fiber, "
				+ ((int) (10 * 400 * sugar / calories) / 10.0) + "% sugar, and "
				+ ((int) (10 * 400 * protein / calories) / 10.0) + "% protein.\n");
		System.out.println("Refrigerated Foods\n------------------");
		for (int j = 0; j < toPrint.size(); j++) {
			if (toPrint.get(j).isRefrigerated()) {
				System.out.println(" - " + toPrint.get(j).getServingUnits() + " " + toPrint.get(j).getName());
			}
		}
		System.out.println("Unrefrigerated Foods\n--------------------");
		for (int j = 0; j < toPrint.size(); j++) {
			if (!toPrint.get(j).isRefrigerated()) {
				System.out.println(" - " + toPrint.get(j).getServingUnits() + " " + toPrint.get(j).getName());
			}
		}
	}

	@Override
	public void actionPerformed(ActionEvent arg0) {
		if (arg0.getSource().equals(maxDiversity)) {
			mustHaves.clear();
			numMusts.clear();
			boolean reversal = true;
			for (int i = 0; i < buttons.size(); i++) {
				if (buttons.get(i).getBackground().equals(Color.green)) {
					reversal = false;
				}
			}
			for (int i = 0; i < available.size(); i++) {
				if (!reversal) {
					if (available.get(i).isAvailable()) {
						mustHaves.add(available.get(i));
						numMusts.add("<=1");
						buttons.get(i).setBackground(Color.blue);
					}
				} else {
					if (buttons.get(i).getBackground().equals(Color.blue)) {
						buttons.get(i).setBackground(Color.green);
					}
				}
			}
		} else if (arg0.getSource().equals(resetVegetable)) {
			String name = vegetable.getText();
			int i = (int) (Math.random() * (available.size()));
			while (!available.get(i).isVegetable() || !available.get(i).isAvailable()
					|| available.get(i).getName().equals(name)) {
				i = (int) (Math.random() * (available.size()));
			}
			vegetable.setText(available.get(i).getName());
		} else if (arg0.getSource().equals(resetFruit)) {
			String name = fruit.getText();
			int i = (int) (Math.random() * (available.size()));
			while (!available.get(i).isFruit() || !available.get(i).isAvailable()
					|| available.get(i).getName().equals(name)) {
				i = (int) (Math.random() * (available.size()));
			}
			fruit.setText(available.get(i).getName());
		} else if (arg0.getSource().equals(flush)) {
			Food blue = new Food(Boolean.parseBoolean(arr[0].getText()), arr[1].getText(),
					Integer.parseInt(arr[2].getText()), arr[3].getText(), Float.parseFloat(arr[4].getText()),
					Float.parseFloat(arr[5].getText()), Float.parseFloat(arr[6].getText()),
					Float.parseFloat(arr[7].getText()), Float.parseFloat(arr[8].getText()),
					Float.parseFloat(arr[9].getText()), Boolean.parseBoolean(arr[10].getText()),
					Boolean.parseBoolean(arr[11].getText()), Boolean.parseBoolean(arr[12].getText()));
			available.add(blue);
			buttons.add(new JButton(blue.getName()));
			buttons.get(buttons.size() - 1).setBackground(Color.green);
			buttons.get(buttons.size() - 1).addActionListener(this);
			add(buttons.get(buttons.size() - 1));
			setVisible(true);
		} else if (arg0.getSource().equals(plunge)) {
			for (int i = 0; i < available.size(); i++) {
				if (available.get(i).getName().equals(toRemove.getText())) {
					for (int j = 0; j < mustHaves.size(); j++) {
						if (mustHaves.get(j).getName().equals(toRemove.getText())) {
							mustHaves.remove(j);
							numMusts.remove(j);
							j--;
						}
					}
					available.remove(i);
					remove(buttons.remove(i));
					i--;
				}
			}
			repaint();
			setVisible(true);
		} else {
			if (((JButton) arg0.getSource()).getBackground().equals(Color.blue)) {
				((JButton) arg0.getSource()).setBackground(Color.red);
				available.get(buttons.indexOf(arg0.getSource())).setAvailable(false);
				numMusts.remove(mustHaves.indexOf(available.get(buttons.indexOf(arg0.getSource()))));
				mustHaves.remove(mustHaves.indexOf(available.get(buttons.indexOf(arg0.getSource()))));
			} else if (((JButton) arg0.getSource()).getBackground().equals(Color.green)) {
				((JButton) arg0.getSource()).setBackground(Color.blue);
				mustHaves.add(available.get(buttons.indexOf(arg0.getSource())));
				numMusts.add("==1");
			} else if (((JButton) arg0.getSource()).getBackground().equals(Color.red)) {
				((JButton) arg0.getSource()).setBackground(Color.green);
				available.get(buttons.indexOf(arg0.getSource())).setAvailable(true);
			}
		}
	}

	@Override
	public void windowClosing(WindowEvent evt) {

		if (evt.getSource().equals(this)) {
			frame.setVisible(false);
			fraem.setVisible(false);
			setVisible(false);
			try {
				updateFoodlist();
			} catch (IOException e) {
				e.printStackTrace();
			}
			for (int i = 0; i < available.size(); i++) {
				if (!available.get(i).isAvailable()) {
					available.remove(i);
					i--;
				}
			}
			System.out.println(
					"The ratio of calories to grams is as follows: 1 gram of fat is 9 calories, 1 gram of carbohydrate (including sugar) is 4 calories, 1 gram of fiber is about 1 calorie, and 1 gram of protein is 4 calories.");
			Scanner scan = new Scanner(System.in);
			System.out.println("How many calories in this meal?");
			int totalCalories = scan.nextInt();
			System.out.println("What caloric fat percentage (Recommended: 25)?");
			int fatPercentage = scan.nextInt();
			System.out.println("What caloric carbohydrate percentage (Recommended: 55)?");
			int carbPercentage = scan.nextInt();
			System.out.println("What caloric fiber percentage (Recommended: 3)?");
			int fiberPercentage = scan.nextInt();
			System.out.println("What caloric sugar percentage (Recommended: 5)?");
			int sugarPercentage = scan.nextInt();
			System.out.println("What caloric protein percentage (Recommended: 20)?");
			int proteinPercentage = scan.nextInt();
			System.out.println("What margin of error (Recommended: 4)?");
			int margin = scan.nextInt();
			scan.close();
			makeMeal(totalCalories, fatPercentage, carbPercentage, fiberPercentage, sugarPercentage, proteinPercentage,
					margin);
			System.exit(0);
		} else if (evt.getSource() == frame) {
			frame.setVisible(false);
		} else if (evt.getSource() == fraem) {
			fraem.setVisible(false);
		}
	}

	public void keyTyped(KeyEvent evt) {
		if (evt.getKeyChar() == '\n' && mustHaves.size() > 0) {
			numMusts.set(numMusts.size() - 1, numMust.getText());
			if (!numMusts.get(numMusts.size() - 1).contains("==") && !numMusts.get(numMusts.size() - 1).contains("<=")
					&& !numMusts.get(numMusts.size() - 1).contains(">=")) {
				numMusts.set(numMusts.size() - 1, "==" + numMusts.get(numMusts.size() - 1));
			}
			if (numMusts.get(numMusts.size() - 1).equals(">=0")) {
				numMusts.remove(numMusts.size() - 1);
				buttons.get(available.indexOf(mustHaves.remove(mustHaves.size() - 1))).setBackground(Color.green);
			} else if (numMusts.get(numMusts.size() - 1).equals("==0")) {
				numMusts.remove(numMusts.size() - 1);
				buttons.get(available.indexOf(mustHaves.remove(mustHaves.size() - 1))).setBackground(Color.red);
			} else {
				numMust.setText(numMusts.get(numMusts.size() - 1));
			}
		}
	}

	public static void updateFoodlist() throws IOException {
		ArrayList<Food> right = new ArrayList<Food>();
		ArrayList<Food> left = new ArrayList<Food>();
		for (int i = 0; i < available.size(); i++) {
			int j = 0;
			if (!available.get(i).isAvailable()) {
				for (; j < right.size() && available.get(i).getName().compareTo(right.get(j).getName()) > 0; j++) {
				}
				right.add(j, available.get(i));
			} else {
				for (; j < left.size() && available.get(i).getName().compareTo(left.get(j).getName()) > 0; j++) {
				}
				left.add(j, available.get(i));
			}
		}
		String file = "";
		for (int i = 0; i < left.size(); i++) {
			file += left.get(i).toString();
		}
		for (int i = 0; i < right.size(); i++) {
			file += right.get(i).toString();
		}
		FileWriter writer = new FileWriter("src/Foodlist");
		writer.append(file);
		writer.flush();
		writer.close();
	}

	@Override
	public void windowActivated(WindowEvent e) {
	}

	@Override
	public void windowClosed(WindowEvent e) {
	}

	@Override
	public void windowDeactivated(WindowEvent e) {
	}

	@Override
	public void windowDeiconified(WindowEvent e) {
	}

	@Override
	public void windowIconified(WindowEvent e) {
	}

	@Override
	public void windowOpened(WindowEvent e) {
	}

	@Override
	public void keyPressed(KeyEvent arg0) {
	}

	@Override
	public void keyReleased(KeyEvent arg0) {
	}
}