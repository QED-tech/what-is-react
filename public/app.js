const api = {
    get(url) {
        switch (url) {
            case '/lots':
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve([
                            {
                                id: 1,
                                name: "apple",
                                description: "Apple description",
                                price: 15
                            },
                            {
                                id: 2,
                                name: "orange",
                                description: "Orange description",
                                price: 33
                            },
                            {
                                id: 3,
                                name: "mango",
                                description: "Mango description",
                                price: 22
                            }
                        ])
                    }, 2000)
                })
            default:
                throw new Error('Url not found');
        }
    }
}


//##############################
const clockInitialState = {
    time: new Date()
}

const SET_TIME = 'SET_TIME'

function clockReducer(state = clockInitialState, action) {
    switch (action.type) {
        case SET_TIME:
            return {
                ...state,
                time: action.time
            }
        default:
            return state
    }
}

function setTime(time) {
    return {
        type: SET_TIME,
        time
    }
}

//##############################
const auctionInitialState = {
    lots: null
}

const SET_LOTS = 'SET_LOTS'
const CHANGE_LOT_PRICE = 'CHANGE_LOT_PRICE'

function auctionReducer(state = auctionInitialState, action) {
    switch (action.type) {
        case SET_LOTS:
            return {
                ...state,
                lots: action.lots
            }
        case CHANGE_LOT_PRICE:
            return {
                ...state,
                lots: state.lots.map((lot) => {
                    if (lot.id === action.id) {
                        return {
                            ...lot,
                            price: action.price
                        }
                    }
                    return lot
                })
            }
        default:
            return state
    }
}

function setLots(lots) {
    return {
        type: SET_LOTS,
        lots
    }
}

function changeLotPrice(id, price) {
    return {
        type: CHANGE_LOT_PRICE,
        id,
        price
    }
}

//##############################`
const store = Redux.createStore(Redux.combineReducers({
    clock: clockReducer,
    auction: auctionReducer
}))
//##############################

const stream = {
    subscribe(channel, listener) {
        const match = /price-(\d+)/.exec(channel)
        if (match) {
            setInterval(() => {
                listener({
                    id: +match[1],
                    price: Math.round(Math.random() * 10 + 30)
                })
            }, 1400)
        }
    }
}

//##############################

const Header = () => {
    return (
        <header className="header">
            <div className="container">
                <Logo/>
            </div>
        </header>
    )
}

const Logo = () => {
    return <img className="logo" src="logo.jpg" alt=""/>
}

const Clock = ({ time }) => {
    const isDay = time.getHours() >= 7 && time.getHours() <= 21

    return (
        <div className="clock">
            <span className="value">{time.toLocaleTimeString()}</span>
            <span className={isDay ? 'icon day' : 'icon night'}/>
        </div>
    )
}

const App = ({ state }) => {
    return (
        <div className="app">
            <Header/>
            <div className="container">
                <Clock time={state.clock.time}/>
                <Lots lots={state.auction.lots}/>
            </div>
        </div>
    )
}

function Loading() {
    return <div className="loading">Loading...</div>
}

const Lots = ({ lots }) => {
    if (lots === null) {
        return <Loading/>
    }

    return (
        <div className="lots">
            {lots.map((lot) => <Lot lot={lot} key={lot.id}/>)}
        </div>
    )
}

function Lot({ lot }) {
    return (
        <article className="lot">
            <div className="price">
                <small className="price-small">price: </small>
                $
                {lot.price}
            </div>
            <h1>{lot.name}</h1>
            <p>{lot.description}</p>
        </article>
    )
}


const renderView = (state) => {
    ReactDOM.render(
        <App state={state}/>,
        document.getElementById('root')
    )
}

store.subscribe(() => {
    renderView(store.getState())
})

renderView(store.getState())
//##############################

setInterval(() => {
    store.dispatch(setTime(new Date()))
}, 1000)

api.get('/lots').then((lots) => {
    store.dispatch(setLots(lots))

    lots.forEach((lot) => {
        stream.subscribe(`price-${lot.id}`, (data) => {
            store.dispatch(changeLotPrice(data.id, data.price))
        })
    })
})
//##############################

