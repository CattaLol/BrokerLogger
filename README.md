# BrokerLogger

By: Cattalol

Have you ever wanted to parse broker transactions to determine past price trends? Wanted to see what's been selling, how much things are selling at, who's selling, and their market share?

A Tera-Toolbox/Tera-Proxy QoL module for data-scraping broker transactions into human-friendlier data files (CSV or JSON). Additionally, the module allows searching ALL current listings within a single search query. 

Note: the game itself will only make available historical transactions from the past ~30 or so days. If you want to build a database without temporal gaps, make sure you log data at least once per month.

## Platform compatibility
- Tested on [Caali's Tera Toolbox](https://github.com/tera-toolbox/tera-toolbox) only.
- May or may not be compatible with [Pinkie-Pie's Tera-Proxy](https://github.com/tera-proxy/tera-proxy) out of the box - untested.

## Required opcodes
- The following opcodes must be mapped for full functionality:
  - S_LOGIN (sent by server on character login)
  - S_TRADE_BROKER_HISTORY_ITEM_LIST (sent by server when it receives a valid request to view broker transaction history)
  - C_TRADE_BROKER_WAITING_ITEM_LIST_NEW (sent by the client when you initiate a new search on broker transaction history)
  - C_TRADE_BROKER_HISTORY_ITEM_LIST_PAGE (sent by the client when you request to change pages within a broker transaction history search)
- [Tera-Proxy's tera-data](https://github.com/tera-proxy/tera-data/tree/master/map) repository typically has full opcodes for EU and other regions.
- If Pinkie takes awhile to update, you can use a [packet debugger](https://github.com/SoliaRdi/PacketsLogger) to map them yourself (it's not hard if you already have the protocol definition).

## Data structure
- Each JSON array element / CSV row (aside from the header) represents a single brokerage transaction.
- All fields from the [S_TRADE_BROKER_HISTORY_ITEM_LIST](https://github.com/tera-toolbox/tera-data/blob/master/protocol/S_TRADE_BROKER_HISTORY_ITEM_LIST.2.def) will be included. Relevant fields of interest will generally be:
  - auction: auction id (unique identifier per transaction)
  - dbid: database id.
  - id: this is the itemId; commonly found in [S_ITEMLIST](https://github.com/tera-toolbox/tera-data/blob/master/protocol/S_ITEMLIST.3.def) and other similar packets. A.k.a. what item was sold.
  - amount: stack size.
  - ownerId: this is the playerId; found in [S_LOGIN](https://github.com/tera-toolbox/tera-data/blob/master/protocol/S_LOGIN.14.def) and other similar packets. This uniquely identifies the character in question (in conjunction with their character name).
  - buyNow: Set to true if the buyer bought without negotiation.
  - time: The unix timestamp of the transaction, represented in seconds since [00:00:00 UTC on 1 January 1970](https://en.wikipedia.org/wiki/Unix_time).
  - price: how much was paid, in units of copper:
    - Copper = 1
    - Silver = 100
    - Gold = 10000    
  - itemLevel: item level.
  - name: Character name. _**Yes, you can see who exactly has sold what by character names.**_.

## Log Files
- All data files generated will be stored in the folder *\<Path to ToolBox/Proxy>\mods\Broker-Logger\logs\\*. 
- Log file names are constructed as: \<Region>-\<ServerID>-YYYY-MM-DD-hhmmss.\<extension>
- Log files generated in either CSV or JSON format

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
