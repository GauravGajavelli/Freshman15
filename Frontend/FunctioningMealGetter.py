import re
import requests
from bs4 import BeautifulSoup


def writetoindex(scripts, menuitems):
    # gets file string
    g = open("FoodProjectMark2\public\scripts\App.js", "r")
    strni = g.read()
    g.close()

    # finds start and end
    firststr = "function breakfast()"
    secondstr = "function DONOTDELETE()"
    start1 = strni.find(firststr)
    start2 = strni.find(secondstr)
    print(start1)
    print(start2)

    # saves start and end for later reconstitution (easier than seek stuff)
    firstpart = strni[:start1]
    secondpart = strni[start2:]
    # print(firstpart)
    # print("\n\n\n\n")
    # print(secondpart)

    # Writing
    f = open("FoodProjectMark2\public\scripts\App.js", "w")

    # writing first part
    f.write(firstpart)

    # breakfast being written to
    inde = scripts[0].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("function breakfast() {\n \t return" +
            scripts[0].text[inde:-11]+".stations;\n}\n\n")
    # grabngo being written to
    inde = scripts[1].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("function grabngo() { \n \t return " +
            scripts[1].text[inde:-11]+".stations;\n}\n\n")
    # lunch being written to
    inde = scripts[2].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("function lunch() { \n \t return " +
            scripts[2].text[inde:-11]+".stations;\n}\n\n")
    # dinner being written to
    inde = scripts[3].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("function dinner() { \n \t return " +
            scripts[3].text[inde:-11]+".stations;\n}\n\n")
    # menu being written to
    inde = menuitems.text.find("Bamco.menu_items")+len("Bamco.menu_items")+3
    indetwo = menuitems.text.find("Bamco.cor_icons")
    f.write("function menuItems() { \n \t return " +
            menuitems.text[inde:indetwo-5]+"\n}\n\n")

    # writing second part
    f.write(secondpart)

    f.close()


def main():
    # Get the HTML from the URL
    url = "https://rose-hulman.cafebonappetit.com/"
    response = requests.get(url)

    # Parse the HTML with BeautifulSoup
    soup = BeautifulSoup(response.content, "html.parser")

    # Find all the scripts with Bamco.dayparts in them using regular expressions
    scripts = soup.find_all("script", string=re.compile(r"Bamco\.dayparts"))
    menuitems = soup.find_all(
        "script", string=re.compile(r"Bamco\.menu_items"))

    # # Print the scripts for comparison to file output
    # for script in scripts:
    #     print(script.text)

    # adds invisi-divs to the html to make them easily accessible
    writetoindex(scripts, menuitems[0])


if __name__ == "__main__":
    main()
