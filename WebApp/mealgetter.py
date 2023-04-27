import re
import requests
from bs4 import BeautifulSoup


# testhtml: Tests the new html by writing to meals.html


def testhtml(scripts):
    # Beginning of meals html ("a" for append mode)
    f = open("public/files/meals.html", "w")
    # f = open("public/index.html", "a")
    f.write("<!DOCTYPE html> <html lang=\"en\"> <head ></head> <body >")

    # breakfast being written to
    inde = scripts[0].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("<div id=\"breakfast\" style=\"display:none;\">" +
            scripts[0].text[inde:-11]+"</div>")
    # grabngo being written to
    inde = scripts[1].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("<div id=\"grabngo\" style=\"display:none;\">" +
            scripts[1].text[inde:-11]+"</div>")
    # lunch being written to
    inde = scripts[2].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("<div id=\"lunch\" style=\"display:none;\">" +
            scripts[2].text[inde:-11]+"</div>")
    # dinner being written t
    inde = scripts[3].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("<div id=\"dinner\" style=\"display:none;\">" +
            scripts[2].text[inde:-11]+"</div>")

    # End of html
    f.write("</body></html>")
    f.close()

# writetoindex: Inserts the file into index.html


def writetoindex(scripts):
    # gets file string
    g = open("public/index.html", "r")
    strni = g.read()
    g.close()

    # finds start and end
    start1 = strni.find("<body>")+6
    start2 = strni.find("<nav")
    # print(start1)
    # print(start2)

    # saves start and end for later reconstitution (easier than seek stuff)
    firstpart = strni[:start1]
    secondpart = strni[start2:]
    # print(firstpart)
    # print("\n\n\n\n")
    # print(secondpart)

    # Writing
    f = open("public/index.html", "w")

    # writing first part
    f.write(firstpart)

    # breakfast being written to
    inde = scripts[0].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("<div id=\"breakfast\" style=\"display:none;\">" +
            scripts[0].text[inde:-11]+"</div>")
    # grabngo being written to
    inde = scripts[1].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("<div id=\"grabngo\" style=\"display:none;\">" +
            scripts[1].text[inde:-11]+"</div>")
    # lunch being written to
    inde = scripts[2].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("<div id=\"lunch\" style=\"display:none;\">" +
            scripts[2].text[inde:-11]+"</div>")
    # dinner being written t
    inde = scripts[3].text.find("Bamco.dayparts[")+len("Bamco.dayparts[")+7
    f.write("<div id=\"dinner\" style=\"display:none;\">" +
            scripts[3].text[inde:-11]+"</div>")

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

    # # Print the scripts for comparison to file output
    # for script in scripts:
    #     print(script.text)

    # adds invisi-divs to the html to make them easily accessible
    writetoindex(scripts)


if __name__ == "__main__":
    main()
