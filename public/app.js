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
const initialState = {
    time: new Date(),
    lots: null
}

class Store {
    constructor(initialState) {
        this.state = initialState
        this.listeners = []
    }

    getState() {
        return this.state
    }

    subscribe(callback) {
        this.listeners.push(callback)
    }

    changeState(diff) {
        this.state = {
            ...this.state,
            ...(typeof diff === 'function' ? diff(this.state) : diff)
        }
        this.listeners.forEach((listener) => {
            listener()
        })
    }
}

const store = new Store(initialState)
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
                <Clock time={state.time}/>
                <Lots lots={state.lots}/>
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
    store.changeState({
        time: new Date()
    })
}, 1000)

api.get('/lots').then((lots) => {
    store.changeState({
        lots
    })

    const onPrice = (data) => {
        store.changeState((state) => ({
            lots: state.lots.map((lot) => {
                if (lot.id === data.id) {
                    return {
                        ...lot,
                        price: data.price
                    }
                }
                return lot
            })
        }))
    }

    lots.forEach((lot) => {
        stream.subscribe(`price-${lot.id}`, onPrice)
    })
})
//##############################

