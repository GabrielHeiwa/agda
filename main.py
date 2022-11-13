import requests
import sys
from bs4 import BeautifulSoup

# Get URL of arguments
URL = sys.argv[1]

# Check if this url already read
with open("url_already_checked.txt", "r", encoding="utf-8") as f:
    line = f.readline()
    print(line)
    if not line:
        f.close()
        
    elif line == (URL + "\n"):
        print(f"This URL: {URL} already checked")
        sys.exit(0)
    
# If URL is not checked append this in file of URL already checkeds
with open("url_already_checked.txt", "a", encoding="utf-8") as f:
    f.write(f"{URL}\n")

# Load words already count
words_cloud = dict({})
with open("words_cloud.txt", "r", encoding="utf-8") as f:
    line = f.readline()

    if not line:
        f.close()
    else:
        key, value = line.split(":")
        words_cloud[key] = int(value)

# Open the page of URL and get your content
page = requests.get(URL)
soup = BeautifulSoup(page.content, 'html.parser')

# Get all phrases of HTML tags
phrases = []
for tag in list(soup.children):
    phrases.append(tag.get_text())

# Get all words of phrases
words = []
for phrase in phrases:
    words_phrase = phrase.split()
    words.extend(words_phrase)

# Configure hashmap with the ocurrency of the words in page
for word in words:
    has_word = words_cloud.get(word)

    if (has_word == None):
        words_cloud[word] = 1
    else:
        words_cloud[word] = has_word + 1

# Prepare the lines for the write in file with update values
lines = []
for key in words_cloud:
    value = words_cloud[key]
    lines.append(f"{key}:{value}\n")
    
# Save data
with open("words_cloud.txt", "w", encoding="utf-8") as f:
    f.writelines(lines)   
