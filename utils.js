export function load(url, callback) {
    let e
    const extension = url.split('.').pop()
    if (extension === 'js') {
        e = document.createElement('script')
        e.src = url
        e.type='text/javascript'
    } else {
        e = document.createElement('link')
        e.href = url
        e.rel='stylesheet'
    }
    if (e) {
        e.addEventListener('load', callback)
        document.getElementsByTagName('head')[0].appendChild(e)
    }
}

export function loadDependencies(dependencies, i, callback) {
    if (dependencies.length > 0) {
        this.load(dependencies[i], () => {
            if (i < dependencies.length-1) {
                this.loadDependencies(dependencies, i+1, callback) 
            } else {
                callback()
            }
        })
    }
}

export function delimitedStringToObjArray(delimitedData, delimiter) {
    delimiter = delimiter || `\t`
    const objArray = []
    const lines = delimitedData.split('\n').filter(line => line.trim() !== '')
    if (lines.length > 1) {
        const keys = lines[0].split(delimiter).map(key => key.trim())
        lines.slice(1).forEach(line => {
        let obj = {}
        line.split(delimiter)
        .map(value => value.trim())
        .forEach((value, i) => {
            let rawKey = keys[i].split('.')
            let key = rawKey[0]
            let prop = rawKey.length === 2 ? rawKey[1] : 'id'
            if (!obj[key]) obj[key] = {}
            if (value || prop === 'id') {
            obj[key][prop] = value
            }
        })      
        objArray.push(obj)
        })
        let assignedId = 0
        let labels = {}
        objArray.forEach(obj => {
        Object.values(obj).forEach(child => {
            if (child.id === '' && child.label) {
            if (!labels[child.label]) labels[child.label] = ++assignedId
            child.id = labels[child.label]
            }
        })
        })
    }
    return objArray
}

export function eqSet(as, bs) {
    if (as.size !== bs.size) return false
    for (var a of as) if (!bs.has(a)) return false
    return true
}