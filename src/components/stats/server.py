from flask import Flask, jsonify, request
import yfinance as yf

app = Flask(__name__)

@app.route('/api/market_data', methods=['GET'])
def get_market_data():
    symbols = request.args.get('symbols', '').split(',')
    if not symbols or symbols == ['']:
        return jsonify({"error": "No symbols provided"}), 400

    data = {}
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol.strip())  # Remove extra spaces
            history = ticker.history(period="1d")  # Get daily data

            if not history.empty:
                last_row = history.iloc[-1]
                data[symbol] = {
                    "close": last_row['Close'],
                    "open": last_row['Open'],
                    "change": last_row['Close'] - last_row['Open'],
                }
            else:
                data[symbol] = {"error": f"No data available for {symbol}"}
        except Exception as e:
            data[symbol] = {"error": f"Failed to fetch data for {symbol}: {str(e)}"}

    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
