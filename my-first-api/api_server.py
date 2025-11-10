from flask import Flask, jsonify
import pyodbc
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


server = r'SREEJASUNKARA\SQLEXPRESS'
database = 'AmazonTable'
cnxn_str = (f'DRIVER={{ODBC Driver 17 for SQL Server}};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;')

def fetchdata():
    cnxn = pyodbc.connect(cnxn_str)
    cursor = cnxn.cursor()
    query = """
    SELECT [Date], [SearchTerm], [Ranking], [Title], [ProductURL],
           [ProductImageURL], [ASIN], [Sponsored], [Rating],
           [NoofReviews], [Price], [Comparision_Price],
           [Promotions], [Ribbons]
    FROM dbo.SearchtermsDataTable
    """
    cursor.execute(query)

    columns = [column[0] for column in cursor.description]
    rows = cursor.fetchall()
    result = [dict(zip(columns, row)) for row in rows]

    cnxn.close()
    return result

@app.route('/my-first-api', methods=['GET'])
def get_data():
    data = fetchdata()
    return jsonify(data)

from flask import send_from_directory

@app.route('/')
def serve():
    return send_from_directory('react-frontend/build', 'index.html')

if __name__ == '__main__':
    app.run(debug=True)

