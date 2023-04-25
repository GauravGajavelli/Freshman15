import re
import requests
from bs4 import BeautifulSoup

# Get the HTML from the URL
url = "https://rose-hulman.cafebonappetit.com/"
response = requests.get(url)

# Parse the HTML with BeautifulSoup
soup = BeautifulSoup(response.content, "html.parser")

# Find all the scripts with Bamco.dayparts in them using regular expressions
scripts = soup.find_all("script", string=re.compile(r"Bamco\.dayparts"))

# Print the scripts
for script in scripts:
    print(script.text)
