import React, { useState, useEffect } from 'react';
import axios from 'axios';


const App = () => {
    const [products, setProducts] = useState([]);
    const [searchterm, setSearchterm] = useState('');
    const [title, setTitle] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

       

    useEffect(() => {
        axios.get('/my-first-api')  
        .then(res => {
        const sortedData = res.data.sort((a, b) => new Date(b.Date) - new Date(a.Date));
        setProducts(sortedData);
      })
        .catch(err => console.error("API fetch error", err));
    }, []);

  const searchTermOptions = [...new Set(products.map(p => p.SearchTerm))];
  const titleOptions = [...new Set(products.map(p => p.Title))];
  const dateOptions = [...new Set(products.map(p => new Date(p.Date).toLocaleDateString('en-GB')))];

  const filteredProducts = products.filter(p => {
    return (
      (searchterm === '' || p.SearchTerm === searchterm) &&
      (title === '' || p.Title === title) &&
      (selectedDate === '' || new Date(p.Date).toLocaleDateString('en-GB') === selectedDate)
       
    );
  });
            
    return (
      <div style={{ padding: "20px" }}>
      <h1>Amazon Product Data</h1>

      {products.length === 0 ? (
        <p>Loading...</p>
      ) : (
        <div >
          <div>
            <label>Search Term: 
          <select value={searchterm} onChange={e => setSearchterm(e.target.value)} style={{ width: '200px' }}>
                  <option value="">All</option>
                  {searchTermOptions.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                    
                  ))}
          </select>
          </label >
                   
          <label > Title: 
          <select value={title} onChange={e => setTitle(e.target.value)} style={{ width: '200px' }}>
                  <option value="">All</option>
                  {titleOptions.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
          </select>
          </label>
          <label>
              Date:
              <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: '200px', marginLeft: '10px' }}>
                <option value="">All</option>
                {dateOptions.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </label>
           
          </div>
        
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Date</th>
              <th>SearchTerm</th>
              <th>Ranking</th>
              <th>Title</th>
              <th>Price</th>
              <th>Comparision_Price</th>
              <th>Rating</th>
              <th>NoofReviews</th>
              <th>ASIN</th>
              <th>Sponsored</th>
              <th>Promotions</th>
              <th>Ribbons</th>
            </tr>
            <tr>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p, index) => (
              <tr key={index}>
                <td>{new Date(p.Date).toLocaleDateString('en-GB')}</td>
                <td>{p.SearchTerm}</td>
                <td>{p.Ranking}</td>
                <td>{p.Title}</td>
                <td>{p.Price ? `$${parseFloat(p.Price).toFixed(2)}` : ''}</td>
                <td>{p.Comparision_Price ? `$${parseFloat(p.Comparision_Price).toFixed(2)}` : ''}</td>
                <td>{p.Rating}</td>
                <td>{p.NoofReviews}</td>
                <td>{p.ASIN}</td>
                <td>{p.Sponsored}</td>
                <td>{p.Promotions}</td>
                <td>{p.Ribbons}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
    
    );

  }
export default App;


