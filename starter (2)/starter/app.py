from flask import Flask, render_template, request
import duckdb

app = Flask(__name__)
continuous_columns = ['humidity', 'temp', 'wind']
discrete_columns = ['day']
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
sorted_months = sorted(months)


@app.route('/')
def index():
    # Retrieves the minimum and maximum X and Y coordinates
    scatter_ranges_query = f'SELECT MIN(X), MAX(X), MIN(Y), MAX(Y) FROM forestfires.csv' 
    scatter_ranges_results = duckdb.sql(scatter_ranges_query).df()
    print(scatter_ranges_results)
    print(type(scatter_ranges_results["min(X)"]))
    # min_x = scatter_ranges["".]
    min_x = scatter_ranges_results["min(X)"].iloc[0]
    max_x = scatter_ranges_results["max(X)"].iloc[0]
    min_y = scatter_ranges_results["min(Y)"].iloc[0]
    max_y = scatter_ranges_results["max(Y)"].iloc[0]
    # scatter_ranges = [scatter_ranges_results["min(X)"], scatter_ranges_results["max(X)"], scatter_ranges_results["min(Y)"], scatter_ranges_results["max(Y)"]]
    # scatter_ranges = [120,320,20,30]
    scatter_ranges = [min_x,max_x,min_y,max_y]
  
    max_count_query = 'SELECT COUNT(*) FROM forestfires.csv GROUP BY month'
    max_count_results = duckdb.sql(max_count_query).df()
    print(max_count_results)
    max_count = max_count_results["count_star()"].max()
    print(max_count_results["count_star()"].max())

    # temp,humidity,wind
    filter_ranges_query = 'SELECT MIN(temp),MAX(temp), MIN(humidity), MAX(humidity), MIN(wind), MAX(wind) FROM forestfires.csv'
    filter_ranges_results = duckdb.sql(filter_ranges_query).df()
    print(filter_ranges_results)
    print(filter_ranges_results.columns)
    print(filter_ranges_results["min(wind)"])
    min_temp = filter_ranges_results["min(\"temp\")"].iloc[0]
    max_temp = filter_ranges_results["max(\"temp\")"].iloc[0]
    min_hum = filter_ranges_results["min(humidity)"].iloc[0]
    max_hum = filter_ranges_results["max(humidity)"].iloc[0]
    min_wind = filter_ranges_results["min(wind)"].iloc[0]
    max_wind = filter_ranges_results["max(wind)"].iloc[0]
    filter_ranges = {
        "temp": [min_temp,max_temp],
        "humidity" : [min_hum, max_hum],
        "wind": [min_wind,max_wind]
    } 

    return render_template(
        'index.html', months=months, days=days,
        filter_ranges=filter_ranges, scatter_ranges=scatter_ranges, max_count=max_count
    )

@app.route('/update', methods=["POST"]) 
def update():
    request_data = request.get_json()
    continuous_predicate = ' AND '.join([f'({column} >= 0 AND {column} <= 0)' for column in continuous_columns]) # TODO: update where clause from sliders
    discrete_predicate = ' AND '.join([f'{column} IN ()' for column in discrete_columns]) # TODO: update where clause from checkboxes
    predicate = ' AND '.join([continuous_predicate, discrete_predicate]) # Combine where clause from sliders and checkboxes

    scatter_query = f'SELECT X, Y FROM forestfires.csv WHERE {predicate}'
    scatter_results = duckdb.sql(scatter_query).df()
    print(scatter_results)
    scatter_data = [] # TODO: Extract the data that will populate the scatter plot

    bar_query = f'SELECT * FROM forestfires.csv' # TODO: Write a query that retrieves the number of forest fires per month after filtering
    bar_results = duckdb.sql(bar_query).df()
    bar_results['month'] = bar_results.index.map({i: sorted_months[i] for i in range(len(sorted_months))})
    bar_data = [] # TODO: Extract the data that will populate the bar chart from the results
    max_count = 0 # TODO: Extract the maximum number of forest fires in a single month from the results

    return {'scatter_data': scatter_data, 'bar_data': bar_data, 'max_count': max_count}

if __name__ == "__main__":
    app.run(debug=True, port=7000)

