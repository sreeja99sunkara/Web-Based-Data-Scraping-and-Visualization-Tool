from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from datetime import date,datetime
import pandas as pd

df=pd.read_excel('SearchTerms.xlsx')
list_var=df['SearchTerms'].tolist()

#chrome_options=webdriver.ChromeOptions()
#chrome_options.add_argument("--incognito")
#driver=webdriver.Chrome(options=chrome_options)

driver=webdriver.Firefox()
driver.get("https://www.amazon.com/")

driver.refresh()
driver.refresh()

Date=[]
SearchTerm=[]
Ranking=[]
Title=[]
ProductURL=[]
ProductImageURL=[]
ASIN=[]
Sponsored=[]
Rating=[]
NoofReviews=[]
Price=[]
Comparision_Price=[]
Promotions=[]
Ribbons=[]

for i in list_var:
    search=driver.find_element(By.ID,"twotabsearchtextbox")
    search.send_keys(i)
    searchbtn=driver.find_element(By.ID,"nav-search-submit-button")
    searchbtn.click()

    items = driver.find_elements(By.XPATH, '//div[@role="listitem" and @data-asin!=""]')

    count=1    
    for item in items:
        #date
        today_str = date.today().strftime('%m/%d/%Y')  # e.g., '07/29/2025'
        Date.append(today_str)
        #date=date.today()
        #Date.append(date)

        #searchterm
        SearchTerm.append(i)
    
        #rank
        Ranking.append(count)
        count=count+1

        #title
        name=item.find_element(By.TAG_NAME,"h2")
        Title.append(name.text)

        #ASIN
        dt_asin=item.get_attribute("data-asin")
        ASIN.append(dt_asin)
    
        #product url
        link=item.find_element(By.TAG_NAME,"a")
        href=(link.get_attribute("href"))
        ProductURL.append(href)

        #product img url
        imglink=item.find_element(By.TAG_NAME,"img")
        src=imglink.get_attribute("src")
        ProductImageURL.append(src)
    
        #sponsored
        try:
            spon = item.find_element(By.XPATH, ".//span[@aria-label]")
            spons = spon.get_attribute("aria-label")
            if spons == "View Sponsored information or leave ad feedback":
                Sponsored.append("sponsored")
            else:
                Sponsored.append("")
        except:
            Sponsored.append("")
    
        #rating
        try:
            rating_span = item.find_element(By.XPATH, ".//span[@class='a-icon-alt']")
            rating = rating_span.get_attribute("innerHTML")
            rating1=rating.split(" out of")[0]
            #rating = rating_span.text
        except:
            rating1 = ""
        Rating.append(rating1)

        #no of reviews
        try:
            reviews = item.find_element(By.XPATH, ".//a[contains(@aria-label, 'ratings')]")
            reviewtxt = reviews.get_attribute("aria-label").split(" out of")[0]
            review = int(''.join(filter(str.isdigit, reviewtxt)))
        except:
            review = ""
        NoofReviews.append(review)

        #price
        priceTag=item.find_elements(By.CLASS_NAME,"a-price")
        if len(priceTag)>0:
            wholeprice = priceTag[0].find_elements(By.CLASS_NAME,"a-offscreen")
            if len(wholeprice)>0:
                ItemPrice = wholeprice[0].get_attribute("innerHTML")
            else:
                ItemPrice = ""
        else:
            ItemPrice = ""
        Price.append(ItemPrice)

        #comparision_price
        try:
            spans=item.find_element(By.XPATH,".//span[@data-a-strike='true']")
            CompPrice = spans.find_element(By.XPATH, ".//span[@class='a-offscreen']")
            pr=CompPrice.get_attribute("innerHTML")
        except:
            pr=""
        Comparision_Price.append(pr)

        #promotions
        try:
            div=item.find_element(By.XPATH,".//div[@data-cy='price-recipe']")
            divs=div.find_element(By.XPATH,".//div[@class='a-row a-size-base a-color-secondary']")
            promo=divs.find_elements(By.TAG_NAME, "span")
            promotions=promo[0].text
        except:
            promotions=""
        Promotions.append(promotions) 

        #ribbons
        try:
            badge=item.find_element(By.XPATH,".//span[@class='a-badge-text']")
            ribb=badge.text 
        except:
            ribb=""
        Ribbons.append(ribb)

    driver.get("https://www.amazon.com/")


dict_1 = {'Date':Date,
          'SearchTerm':SearchTerm,
          'Ranking': Ranking,
          'Title': Title,
          'ASIN':ASIN,
          'ProductURL': ProductURL,
          'ProductImageURL':ProductImageURL,
          'Sponsored':Sponsored,
          'Rating':Rating,
          'NoofReviews':NoofReviews,
          'Price':Price,
          'Comparision_Price':Comparision_Price,          
          'Promotions':Promotions,
          'Ribbons':Ribbons}    

df = pd.DataFrame(dict_1)
df.to_excel("phase-1.xlsx", index=False)

#phase-2
import pyodbc

server = r'SREEJASUNKARA\SQLEXPRESS'
database = 'AmazonTable'

cnxn = pyodbc.connect(f'DRIVER={{ODBC Driver 17 for SQL Server}};'
                      f'SERVER={server};'
                      f'DATABASE={database};'
                      'Trusted_Connection=yes;')
cursor = cnxn.cursor()

for index, row in df.iterrows():
     sql_date = datetime.strptime(row['Date'], '%m/%d/%Y').date()
     cursor.execute("INSERT INTO SearchtermsDataTable (Date, SearchTerm, Ranking, Title, ASIN, ProductURL, ProductImageURL,Sponsored, Rating, NoofReviews, Price, Comparision_Price,Promotions, Ribbons) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    sql_date, 
                    row['SearchTerm'],
                    row['Ranking'],
                    row['Title'],
                    row['ASIN'],
                    row['ProductURL'],
                    row['ProductImageURL'],
                    row['Sponsored'],
                    float(row['Rating']) if str(row['Rating']).replace('.', '', 1).isdigit() else None,
                    int(row['NoofReviews']) if str(row['NoofReviews']).isdigit() else None,
                    float(str(row['Price']).replace('$', '')) if '$' in str(row['Price']) else None,
                    float(str(row['Comparision_Price']).replace('$', '')) if '$' in str(row['Comparision_Price']) else None,
                    row['Promotions'],
                    row['Ribbons']
                    )
cnxn.commit()
cursor.close()


    

