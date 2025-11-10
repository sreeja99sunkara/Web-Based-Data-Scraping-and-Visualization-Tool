import './App.css';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import '@progress/kendo-theme-default/dist/all.css';
import axios from 'axios';
import { Grid, GridColumn, GridColumnMenuFilter } from '@progress/kendo-react-grid';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Chart, ChartTooltip, ChartCategoryAxis, ChartCategoryAxisItem, ChartSeries, ChartSeriesItem, ChartValueAxis, ChartValueAxisItem } from '@progress/kendo-react-charts';
import { filterBy, orderBy } from '@progress/kendo-data-query';
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export';
import { Button } from '@progress/kendo-react-buttons';
import "@progress/kendo-theme-default/dist/all.css";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'


function App() {
  const [data, setData] = useState([]);
  const [fullData, setFullData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(true);


  const [filter, setFilter] = useState({
    logic: "and",
    filters: []
  });
  const [sort, setSort] = useState([]);


  useEffect(() => {
    setLoading(true);
    axios.get('/my-first-api')
      .then((res) => {
        const sortedData = res.data
          .map(item => ({
            ...item,
            Date: new Date(item.Date),
            Price: parseFloat(item.Price) || 0,
            Comparision_Price: parseFloat(item.Comparision_Price) || 0,
            selected: false,
            uniqueKey: `${item.ProductURL}`
          }))
          .sort((a, b) => b.Date - a.Date);
        setData(sortedData);
        setFullData(sortedData);

        if (sortedData.length > 0) {
          const latestDate = sortedData[0].Date;
          setSelectedDate(latestDate);
          const filtered = sortedData.filter(item => item.Date.toDateString() === latestDate.toDateString());
          setData(filtered);
        }

      })
      .catch((error) => console.error("Error fetching data:", error))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    setSelectedRows([]); 
  }, [selectedDate, selectedTerm]);


  const filterData = (term, date) => {
    let filtered = fullData;

    if (term) {
      const selectedTermLower = term.toLowerCase().trim();
      filtered = filtered.filter(item => item.SearchTerm.toLowerCase().trim() === selectedTermLower);
    }

    if (date) {
      const selectedDateString = date.toDateString();
      filtered = filtered.filter(item => new Date(item.Date).toDateString() === selectedDateString);
    }
    setData(filtered);
  };

  const searchTermOptions = useMemo(() => {
    return [
      { text: "All", value: null },
      ...Array.from(new Set(fullData.map(item => item.SearchTerm)))
        .map(term => ({ text: term, value: term }))
    ];
  }, [fullData]);

  const onSearchTermChange = (e) => {
    const term = e.value?.value || null;
    setSelectedTerm(term);
    filterData(term, selectedDate);
  };

  const onDateChange = (e) => {
    const date = e.value || null;
    setSelectedDate(date);
    filterData(selectedTerm, date);

  };
  const onFilterChange = (e) => {
    setFilter(e.filter);
  };

  const onSortChange = (e) => {
    setSort(e.sort);
  };

  const onSelectionChange = (event) => {
    const selectedItem = event.dataItem;
    if (!selectedItem) return;

    const updatedData = data.map(item =>
      item.uniqueKey === selectedItem.uniqueKey
        ? { ...item, selected: !item.selected }
        : item
    );

    setData(updatedData);

    // Update the selectedRows
    const currentlySelected = updatedData.filter(item => item.selected);
    setSelectedRows(currentlySelected);
  };

  const chartData = useMemo(() => {
    let itemsToUse = selectedRows.length > 0 ? selectedRows : data;

    // Group by SearchTerm
    const group = {};
    itemsToUse.forEach(item => {
      const key = item.SearchTerm;
      const price = parseFloat(item.Price) || 0;
      group[key] = (group[key] || 0) + price;
    });

    return Object.entries(group).map(([term, totalPrice]) => ({
      term,
      totalPrice
    }));
  }, [selectedRows, data]);

  const calculateWidth = (title) => {
    return Math.max(title.length * 10, 120); 
  };

  const _export = useRef(null);

  const exportExcel = () => {
    if (_export.current) {
      const formattedData = data.map(item => ({
        ...item,
        Price: `$${item.Price.toFixed(2)}`,
        Comparision_Price: `$${item.Comparision_Price.toFixed(2)}`
      }));
      _export.current.save(formattedData);

    }
  };

  const chartExport = useRef(null);
  const exportChartData = () => {
    if (chartExport.current) {
      const rows = chartData.map(item => ({
        term: item.term,
        totalPrice: item.totalPrice
      }));

      chartExport.current.save(rows);
    }
  };

  const EllipsisCell = (props) => {
    const value = props.dataItem[props.field] || "";
    return (
      <td
        style={{
          maxWidth: "200px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
        title={value}
      >
        {value}
      </td>
    );
  };

  return (

    <div className="App">
      <h2>Amazon Data Table</h2>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', margin: '20px', }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ textAlign: 'left', marginBottom: '5px' }}>Date</p>
            <DatePicker
              value={selectedDate}
              onChange={onDateChange}
              format="MM/dd/yyyy"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ textAlign: 'left', marginBottom: '5px' }}>Search Term</p>
            <DropDownList
              data={searchTermOptions}
              textField="text"
              dataItemKey="value"
              value={searchTermOptions.find((opt) => opt.value === selectedTerm) || searchTermOptions[0]}
              onChange={onSearchTermChange}
              style={{ width: '250px' }}
            />
          </div>
        </div>

        <div>
          <Button themeColor="primary" onClick={exportExcel}>
            Export Grid
          </Button>
        </div>
      </div>
      <div style={{margin: "20px"}}>
      {loading ? <div>
        <Skeleton />
        <Skeleton count={15} />
      </div> :
        <>
          <div>
            <ExcelExport ref={_export} fileName="GridData.xlsx">
              <Grid
                style={{ height: "500px", tableLayout: "fixed", width: "100%" }}
                data={orderBy(filterBy(data, filter), sort)}
                rowHeight={40}
                resizable={true}
                sortable={{ allowUnsort: true, mode: "single" }}
                filter={filter}
                sort={sort}
                onFilterChange={onFilterChange}
                onSortChange={onSortChange}
                selectable={{ enabled: true, drag: false, cell: false, mode: 'multiple' }}
                selectedField="selected"
                dataItemKey="uniqueKey"
                onSelectionChange={onSelectionChange}
                
              >
                <GridColumn columnType='checkbox' width="50px" />
                <GridColumn field="Date" title="Date" format="{0:MM/dd/yyyy}" columnMenu={GridColumnMenuFilter} width={calculateWidth("Date")} />
                <GridColumn field="SearchTerm" title="Search Term" columnMenu={GridColumnMenuFilter} width={calculateWidth("Search Term")} />
                <GridColumn field="Ranking" title="Ranking" columnMenu={GridColumnMenuFilter} width={calculateWidth("Ranking")} />
                <GridColumn field="Title" title="Title" width="200px" cells={{ data: EllipsisCell }} columnMenu={GridColumnMenuFilter} />
                <GridColumn field="ProductURL" title="Product URL" cells={{ data: EllipsisCell }} width="200px" columnMenu={GridColumnMenuFilter} />
                <GridColumn field="ASIN" title="ASIN" columnMenu={GridColumnMenuFilter} width={calculateWidth("ASIN")} />
                <GridColumn field="Sponsored" title="Sponsored" columnMenu={GridColumnMenuFilter} width={calculateWidth("Sponsored")} />
                <GridColumn field="Rating" title="Rating" columnMenu={GridColumnMenuFilter} width={calculateWidth("Rating")} />
                <GridColumn field="NoofReviews" title="No. of Reviews" columnMenu={GridColumnMenuFilter} width={calculateWidth("No. of Reviews")} />
                <GridColumn field="Price" title="Price" format="{0:c2}" columnMenu={GridColumnMenuFilter} width={calculateWidth("Price")} />
                <GridColumn field="Comparision_Price" title="Comparison Price" format="{0:c2}" columnMenu={GridColumnMenuFilter} width={calculateWidth("Comparision Price")} />
                <GridColumn field="Promotions" title="Promotions" columnMenu={GridColumnMenuFilter} width={calculateWidth("Promotions")} />
                <GridColumn field="Ribbons" title="Ribbons" columnMenu={GridColumnMenuFilter} width={calculateWidth("Ribbons")} />
              </Grid>
            </ExcelExport>
          </div>

          <div style={{ position: 'relative', textAlign: 'center' }}>
            <h2 style={{ margin: 10 }}>Search Term vs Price</h2>
            <Button style={{ margin: 10, position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }} onClick={exportChartData} themeColor="primary">
              Export Chart
            </Button>
          </div>

          <ExcelExport ref={chartExport} fileName="ChartData.xlsx">
            <ExcelExportColumn field="term" title="Search Term" />
            <ExcelExportColumn field="totalPrice" title="Total Price" cellOptions={{ format: '$#,##0.00' }} />
          </ExcelExport>
          <Chart  >


            <ChartTooltip render={(props) => (
              <span>
                {props.category} ${props.point.value.toFixed(2)}
              </span>
            )} />

            <ChartCategoryAxis>
              <ChartCategoryAxisItem
                categories={chartData.map(item => item.term)}
                title={{ text: "Search Term" }}
                labels={{ rotation: 'auto' }}
              />
            </ChartCategoryAxis>

            <ChartValueAxis>
              <ChartValueAxisItem title={{ text: "Total Price " }} />
            </ChartValueAxis>

            <ChartSeries>
              <ChartSeriesItem
                type="column"
                data={chartData.map(item => item.totalPrice)}
              />
            </ChartSeries>
          </Chart>
        </>
      }
      </div>
    </div>


  );
}

export default App;


