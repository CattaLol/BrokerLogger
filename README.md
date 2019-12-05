# BrokerLogger

By: Cattalol

A Tera-Toolbox/Tera-Proxy QoL module for data-scraping broker transactions into human-friendlier data files (CSV or JSON). Additionally, the module allows searching ALL current listings within
a single search query.

## Platform compatibility
- Tested on [Caali's Tera Toolbox](https://github.com/tera-toolbox/tera-toolbox) only.
- May or may not be compatible with [Pinkie-Pie's Tera-Proxy](https://github.com/tera-proxy/tera-proxy) out of the box - untested.

## Required opcodes
- The following opcodes must be mapped for full functionality:
  - S_LOGIN (sent by server on character login)
  - S_TRADE_BROKER_HISTORY_ITEM_LIST (sent by server when it receives a valid request to view broker transaction history)
  - C_TRADE_BROKER_WAITING_ITEM_LIST_NEW (sent by the client when you initiate a new search on broker transaction history)
  - C_TRADE_BROKER_HISTORY_ITEM_LIST_PAGE (sent by the client when you request to change pages within a broker transaction history search)

## Log Files
- All data files generated will be stored in the folder *\<Path to ToolBox>\mods\Broker-Logger\logs\\*. 
- Log files generated in either CSV or JSON format
- Log file names are constructed as: \<Region>-\<ServerID>-YYYY-MM-DD-hhmmss

## Usage / Commands
### brokerlistall
- Sends a search query to display **ALL** currently listed items on the broker. 
- The broker window must be open if you want the data displayed in your client (d'oh)
### brokerloghistory
- Sends a search query for **ALL** currently listed transactions within the brokerage history
- Data will be saved to a log file (CSV format by default).
- You do NOT need the broker window open to do this.
- If you DO have the broker window open during data fetching, do NOT close the broker window or data fetching will be terminated.
### brokerlogtype [csv, json]
- Sets log file type. Currently supported are csv and json
- Example: *brokerlogtype csv*
