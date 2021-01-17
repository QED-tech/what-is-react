const api = {
    get(url) {
        switch (url) {
            case '/lots':
                return new Promise((resolve) => {
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
                })
            default:
                throw new Error('Url not found');
        }
    }
}


//##############################
let state = {
    time: new Date(),
    lots: null
}
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
const Container = (props) => {
    return {
        type: 'div',
        props: {
            ...props,
            className: 'container'
        }
    }
}


const Header = (state) => {
    return {
        type: 'header',
        props: {
            className: 'header',
            children: [
                {
                    type: Container,
                    props: {
                        children: [
                            {
                                type: Logo,
                                props: {}
                            },
                            {
                                type: Clock,
                                props: { time: state.time }
                            }
                        ]
                    }
                },

            ]
        }
    }
}

const Logo = () => {
    return {
        type: 'img',
        props: {
            className: 'logo',
            src: "https://st2.depositphotos.com/1496387/8556/v/950/depositphotos_85563812-stock-illustration-food-vector-logo-design-template.jpg",
        }
    }

}

const Clock = ({ time }) => {
    const isDay = time.getHours() >= 7 && time.getHours() <= 21

    return {
        type: 'div',
        props: {
            className: 'clock',
            children: [
                {
                    type: 'span',
                    props: {
                        className: 'value',
                        children: [
                            time.toLocaleTimeString()
                        ]
                    }
                },
                {
                    type: 'span',
                    props: {
                        className: isDay ? 'icon day' : 'icon night',
                    }
                }
            ]
        }
    }
}

const App = ({ state }) => {
    return {
        type: 'div',
        props: {
            className: 'app',
            children: [
                {
                    type: Header,
                    props: { time: state.time }
                },
                {
                    type: Container,
                    props: {
                        children: [
                            {
                                type: Lots,
                                props: { lots: state.lots }
                            }
                        ]
                    }
                }
            ]
        }
    }
}

function Loading() {
    return {
        type: 'div',
        props: {
            className: 'loading',
            children: [
                'Loading...'
            ]
        }
    }
}

const Lots = ({ lots }) => {
    if (lots === null || lots === undefined) {
        return {
            type: Loading,
            props: {}
        }
    }

    return {
        type: 'div',
        props: {
            className: 'lots',
            children: lots.map((lot) => ({
                type: Lot,
                props: { lot }
            }))
        }
    }
}

function Lot({ lot }) {
    return {
        type: 'article',
        key: lot.id,
        props: {
            className: 'lot',
            children: [
                {
                    type: 'div',
                    props: {
                        className: 'price',
                        children: [
                            lot.price
                        ]
                    },
                },
                {
                    type: 'h1',
                    props: {
                        children: [
                            lot.name
                        ],
                    },
                },
                {
                    type: 'p',
                    props: {
                        children: [
                            lot.description
                        ],
                    },
                }
            ],
        }
    }
}


const renderView = (state) => {
    Render(
        App({ state }), document.getElementById('root')
    )
}


function createRealNodeByVirtual(virtual) {
    if (typeof virtual !== 'object') {
        return document.createTextNode('')
    }
    return document.createElement(virtual.type)
}


const Render = (virtualDom, realDomRoot) => {
    const evaluatedVirtualDom = evaluate(virtualDom)

    const virtualDomRoot = {
        type: realDomRoot.tagName.toLowerCase(),
        props: {
            id: realDomRoot.id,
            children: [
                evaluatedVirtualDom
            ]
        },
    }

    sync(virtualDomRoot, realDomRoot)
}

function evaluate(virtualNode) {
    if (typeof virtualNode !== 'object') {
        return virtualNode
    }

    if (typeof virtualNode.type === 'function') {
        return evaluate((virtualNode.type)(virtualNode.props))
    }

    const props = virtualNode.props || {}

    return {
        ...virtualNode,
        props: {
            ...props,
            children: Array.isArray(props.children) ? props.children.map(evaluate) : [evaluate(props.children)]
        }
    }
}

function sync(virtualNode, realNode) {
    // Sync element
    if (virtualNode.props) {
        Object.entries(virtualNode.props).forEach(([name, value]) => {
            if (name === 'key' || name === 'children') {
                return
            }
            if (realNode[name] !== value) {
                realNode[name] = value
            }
        })
    }
    if (virtualNode.key) {
        realNode.dataset.key = virtualNode.key
    }
    if (typeof virtualNode !== 'object' && virtualNode !== realNode.nodeValue) {
        realNode.nodeValue = virtualNode
    }

    // Sync child nodes
    const virtualChildren = virtualNode.props ? virtualNode.props.children || [] : []
    const realChildren = realNode.childNodes

    for (let i = 0; i < virtualChildren.length || i < realChildren.length; i++) {
        const virtual = virtualChildren[i]
        const real = realChildren[i]

        // Remove
        if (virtual === undefined && real !== undefined) {
            realNode.remove(real)
        }

        // Update
        if (virtual !== undefined && real !== undefined && (virtual.type || '') === (real.tagName || '').toLowerCase()) {
            sync(virtual, real)
        }

        // Replace
        if (virtual !== undefined && real !== undefined && (virtual.type || '') !== (real.tagName || '').toLowerCase()) {
            const newReal = createRealNodeByVirtual(virtual)
            sync(virtual, newReal)
            realNode.replaceChild(newReal, real)
        }

        // Add
        if (virtual !== undefined && real === undefined) {
            const newReal = createRealNodeByVirtual(virtual)
            sync(virtual, newReal)
            realNode.appendChild(newReal)
        }
    }
}


renderView(state)
//##############################

api.get('/lots').then((lots) => {
    state = {
        ...state,
        lots
    }

    const onPrice = (data) => {
        state = {
            ...state,
            lots: state.lots.map((lot) => {
                if (lot.id === data.id) {
                    return {
                        ...lot,
                        price: data.price
                    }
                }
                return lot
            })
        }
    }

    lots.forEach((lot) => {
        stream.subscribe(`price-${lot.id}`, onPrice)
    })

})


//##############################
setInterval(() => {
    state = {
        ...state,
        time: new Date()
    }

    renderView(state)
}, 1000)
//##############################

