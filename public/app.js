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
                                price: 15,
                                favorite: true
                            },
                            {
                                id: 2,
                                name: "orange",
                                description: "Orange description",
                                price: 33,
                                favorite: false
                            },
                            {
                                id: 3,
                                name: "mango",
                                description: "Mango description",
                                price: 22,
                                favorite: false
                            }
                        ])
                    }, 2000)
                })
            default:
                throw new Error('Url not found');
        }
    },
    post(url) {
        if (/^\/lots\/(\d+)\/favorite$/.exec(url)) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({})
                }, 500)
            })
        }
        if (/^\/lots\/(\d+)\/unfavorite$/.exec(url)) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({})
                }, 500)
            })
        }
        throw new Error('Unknown address')
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
const FAVORITE_LOT = 'FAVORITE_LOT'
const UNFAVORITE_LOT = 'UNFAVORITE_LOT'

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

        case FAVORITE_LOT:
            return {
                ...state,
                lots: state.lots.map((lot) => {
                    if (lot.id === action.id) {
                        return {
                            ...lot,
                            favorite: true
                        }
                    }
                    return lot
                })
            }
        case UNFAVORITE_LOT:
            return {
                ...state,
                lots: state.lots.map((lot) => {
                    if (lot.id === action.id) {
                        return {
                            ...lot,
                            favorite: false
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

function favoriteLot (id) {
    return {
        type: FAVORITE_LOT,
        id
    }
}

function unfavoriteLot (id) {
    return {
        type: UNFAVORITE_LOT,
        id
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

const App = ({ state, favorite, unfavorite }) => {
    return (
        <div className="app">
            <Header/>
            <div className="container">
                <Clock time={state.clock.time}/>
                <Lots lots={state.auction.lots} favorite={favorite} unfavorite={unfavorite}/>
            </div>
        </div>
    )
}

function Loading() {
    return <div className="loading">Loading...</div>
}

const Lots = ({ lots, favorite, unfavorite }) => {
    if (lots === null) {
        return <Loading/>
    }

    return (
        <div className="lots">
            {lots.map((lot) => <Lot lot={lot} favorite={favorite} unfavorite={unfavorite} key={lot.id} />)}
        </div>
    )
}

function Lot({ lot, favorite, unfavorite }) {
    return (
        <article className={'lot' + (lot.favorite ? ' favorite' : '')}>
            <div className="price">
                <small className="price-small">price: </small>
                $
                {lot.price}
            </div>
            <h1>{lot.name}</h1>
            <p>{lot.description}</p>
            <Favorite
                active={lot.favorite}
                favorite={() => favorite(lot.id)}
                unfavorite={() => unfavorite(lot.id)}
            />
        </article>
    )
}

function Favorite ({ active, favorite, unfavorite }) {
    return active ? (
        <button type="button" onClick={unfavorite} className="unfavorite">
            <ion-icon name="heart-sharp" /> Unfavorite
        </button>
    ) : (
        <button type="button" onClick={favorite} className="favorite">
            <ion-icon name="heart-outline" /> Favorite
        </button>
    )
}


const renderView = (store) => {

    const state = store.getState()

    const favorite = (id) => {
        api.post(`/lots/${id}/favorite`).then(() => {
            store.dispatch(favoriteLot(id))
        })
    }

    const unfavorite = (id) => {
        api.post(`/lots/${id}/unfavorite`).then(() => {
            store.dispatch(unfavoriteLot(id))
        })
    }


    ReactDOM.render(
        <App state={state} favorite={favorite} unfavorite={unfavorite}/>,
        document.getElementById('root')
    )
}

store.subscribe(() => {
    renderView(store)
})

renderView(store)
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

