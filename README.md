# telegram-contest-app

The goal was to develop software for showing simple charts based on input data Telegram provide.
All the code was written from scratch without using specialized charting libraries.

`./src/chart-data.json` file is used as input data for the 5 charts. It contains a vector of JSON objects ('chart'), each representing a separate graph.

`chart.columns` – List of all data columns in the chart. Each column has its label at position 0, followed by values.
x values are UNIX timestamps in milliseconds.

`chart.types` – Chart types for each of the columns. Supported values:
"line" (line on the graph with linear interpolation),
"x" (x axis values for each of the charts at the corresponding positions).

`chart.colors` – Color for each line in 6-hex-digit format (e.g. "#AAAAAA").

`chart.names` – Names for each line.
