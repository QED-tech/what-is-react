// ##########################

const api = {
  get (url) {
    switch (url) {
      case '/lots':
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.25) {
              resolve([
                {
                  id: 1,
                  name: 'Apple',
                  description: 'Apple description',
                  price: 16,
                  favorite: true
                },
                {
                  id: 2,
                  name: 'Orange',
                  description: 'Orange description',
                  price: 41,
                  favorite: false
                },
                {
                  id: 3,
                  name: 'Mango',
                  description: 'Mango description',
                  price: 45,
                  favorite: false
                },
                {
                  id: 4,
                  name: 'Potato',
                  description: 'Potato description',
                  price: 33,
                  favorite: false
                }
              ])
            } else {
              reject(new Error('Connection error'))
            }
          }, 1000)
        })
      default:
        throw new Error('Unknown address')
    }
  },
  post (url) {
    if (/^\/lots\/(\d+)\/favorite$/.exec(url)) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({})
        }, 500)
      })
    }
    if (/^\/lots\/(\d+)\/unfavorite$/.exec(url)) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({})
        }, 500)
      })
    }
    throw new Error('Unknown address')
  }
}

const stream = {
  subscribe (channel, listener) {
    const match = /price-(\d+)/.exec(channel)
    if (match) {
      const interval = setInterval(() => {
        listener({
          id: parseInt(match[1]),
          price: Math.round(Math.random() * 10 + 30)
        })
      }, 400)
      return () => clearInterval(interval)
    }
  }
}

// ##########################

const auctionInitialState = {
  lots: [],
  loading: false,
  loaded: false,
  error: null
}

const LOTS_LOADING_PENDING = 'LOTS_LOADING_PENDING'
const LOTS_LOADING_SUCCESS = 'LOTS_LOADING_SUCCESS'
const LOTS_LOADING_ERROR = 'LOTS_LOADING_ERROR'
const CHANGE_LOT_PRICE = 'CHANGE_LOT_PRICE'
const FAVORITE_LOT = 'FAVORITE_LOT'
const UNFAVORITE_LOT = 'UNFAVORITE_LOT'

function auctionReducer (state = auctionInitialState, action) {
  switch (action.type) {
    case LOTS_LOADING_PENDING:
      return {
        ...state,
        lots: [],
        loading: true,
        loaded: false,
        error: null
      }
    case LOTS_LOADING_SUCCESS:
      return {
        ...state,
        lots: action.lots,
        loading: false,
        loaded: true,
        error: null
      }
    case LOTS_LOADING_ERROR:
      return {
        ...state,
        lots: [],
        loading: false,
        loaded: false,
        error: action.error
      }
    case CHANGE_LOT_PRICE:
      return {
        ...state,
        lots: state.lots.map(lot => {
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
        lots: state.lots.map(lot => {
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
        lots: state.lots.map(lot => {
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

function lotsLoadingPending () {
  return { type: LOTS_LOADING_PENDING }
}

function lotsLoadingSuccess (lots) {
  return { type: LOTS_LOADING_SUCCESS, lots }
}

function lotsLoadingError (error) {
  return { type: LOTS_LOADING_ERROR, error }
}

function loadLotsAsync () {
  return (dispatch, getState, { api }) => {
    dispatch(lotsLoadingPending())
    api
      .get('/lots')
      .then(lots => dispatch(lotsLoadingSuccess(lots)))
      .catch(error => dispatch(lotsLoadingError(error.message)))
  }
}

function changeLotPrice (id, price) {
  return { type: CHANGE_LOT_PRICE, id, price }
}

function subscribeToLotPrice (id) {
  return (dispatch, getState, { stream }) => {
    return stream.subscribe(`price-${id}`, data => {
      dispatch(changeLotPrice(data.id, data.price))
    })
  }
}

function favoriteLot (id) {
  return { type: FAVORITE_LOT, id }
}

function favoriteLotAsync (id) {
  return (dispatch, getState, { api }) => {
    return api.post(`/lots/${id}/favorite`).then(() => {
      dispatch(favoriteLot(id))
    })
  }
}

function unfavoriteLot (id) {
  return { type: UNFAVORITE_LOT, id }
}

function unfavoriteLotAsync (id) {
  return (dispatch, getState, { api }) => {
    return api.post(`/lots/${id}/unfavorite`).then(() => {
      dispatch(unfavoriteLot(id))
    })
  }
}

// ##########################

const thunk = ReduxThunk.default

const store = Redux.createStore(
  Redux.combineReducers({ auction: auctionReducer }),
  Redux.applyMiddleware(thunk.withExtraArgument({ api, stream }))
)

// ##########################

function App () {
  return (
    <div className='app container'>
      <Header />
      <ClockContainer />
      <LotsContainerConnected />
    </div>
  )
}

function Header () {
  return (
    <header className='header'>
      <Logo />
    </header>
  )
}

function Logo () {
  return <img className='logo' src='logo.jpg' alt='' />
}

function ClockContainer () {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [setTime])

  return <Clock time={time} />
}

function Clock ({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21

  return (
    <div className='clock'>
      <span className='value'>{time.toLocaleTimeString()}</span>
      <span className={isDay ? 'icon day' : 'icon night'} />
    </div>
  )
}

function Loading () {
  return <div className='loading'>Loading...</div>
}

function AlertError ({ message }) {
  return <div className='error'>{message}</div>
}

function LotsContainer ({ lots, loading, loaded, error, load }) {
  React.useEffect(() => {
    if (!loaded && !loading && error === null) {
      load()
    }
  }, [loaded, loading, error])

  if (error !== null) {
    return <AlertError message={error} />
  }

  if (loading) {
    return <Loading />
  }

  if (!loaded) {
    return null
  }

  return <Lots lots={lots} />
}

const lotsContainerMapStateToProps = state => ({
  lots: state.auction.lots,
  loading: state.auction.loading,
  loaded: state.auction.loaded,
  error: state.auction.error
})

const lotsContainerMapDispatchToProps = {
  load: loadLotsAsync
}

const LotsContainerConnected = ReactRedux.connect(
  lotsContainerMapStateToProps,
  lotsContainerMapDispatchToProps
)(LotsContainer)

function Lots ({ lots }) {
  return (
    <div className='lots'>
      {lots.map(lot => (
        <LotContainerConnected lot={lot} key={lot.id} />
      ))}
    </div>
  )
}

function LotContainer ({ lot, subscribe }) {
  React.useEffect(() => {
    return subscribe(lot.id)
  }, [lot.id])

  return <LotConnected lot={lot} />
}

const lotContainerMapDispatchToProps = {
  subscribe: subscribeToLotPrice
}

const LotContainerConnected = ReactRedux.connect(
  null,
  lotContainerMapDispatchToProps
)(LotContainer)

function Lot ({ lot, favorite, unfavorite }) {
  return (
    <article className={'lot' + (lot.favorite ? ' favorite' : '')}>
      <div className='price'>{lot.price}</div>
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

const lotMapDispatchToProps = {
  favorite: favoriteLotAsync,
  unfavorite: unfavoriteLotAsync
}

const LotConnected = ReactRedux.connect(null, lotMapDispatchToProps)(Lot)

function Favorite ({ active, favorite, unfavorite }) {
  const [enabled, setEnabled] = React.useState(true)

  const onClickUnfavorite = () => {
    setEnabled(false)
    unfavorite()
      .then(() => setEnabled(true))
      .catch(() => setEnabled(true))
  }

  const onClickFavorite = () => {
    setEnabled(false)
    favorite()
      .then(() => setEnabled(true))
      .catch(() => setEnabled(true))
  }

  return active ? (
    <button
      type='button'
      onClick={onClickUnfavorite}
      className='unfavorite'
      disabled={!enabled}
    >
      <ion-icon name='heart-sharp' />
      Unfavorite
    </button>
  ) : (
    <button
      type='button'
      onClick={onClickFavorite}
      className='favorite'
      disabled={!enabled}
    >
      <ion-icon name='heart-outline' />
      Favorite
    </button>
  )
}

// ##########################

ReactDOM.render(
  <ReactRedux.Provider store={store}>
    <App />
  </ReactRedux.Provider>,
  document.getElementById('root')
)
