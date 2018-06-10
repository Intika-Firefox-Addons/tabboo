function Tab (name, url, favicon, created, pinned) {
  this.name = name
  this.url = url
  this.favicon = favicon
  this.created = created
  this.pinned = pinned
}

const query = browser.tabs.query({ currentWindow: true }).then(query => {
  const now = new Date().toUTCString()
  const noPinned = query.filter(tab => !tab.pinned)

  return noPinned.map(tab => {
    return new Tab(tab.title, tab.url, tab.favIconUrl || 'images/icon__missing.png', now)
  }).filter(tab => !tab.url.search('http'))
})

query.then(array => {
  const elSave = document.querySelector('.session__save')
  const elOpen = document.querySelector('.session__open')
  const elNav = document.querySelector('.nav')
  const elEdit = document.querySelector('.session__edit')
  const elSaveEdit = document.querySelector('.session__saveEdit')

  document.querySelector('.session__date').innerHTML = new Date().toUTCString()

  if (array[0]) { displaySession(array) }

  displaySidebar()
  elSave.addEventListener('click', () => saveSession(array), { capture: false })
  elOpen.addEventListener('click', openSession, false)
  elEdit.addEventListener('click', editSession, false)
  elNav.addEventListener('keyup', () => searchSession(array), false)
  elSaveEdit.addEventListener('click', saveEdit)
})

function openSession () {
  const tabs = Array(... document.querySelectorAll('.tab'))

  const urls = tabs.map(tab => {
    return tab.getElementsByClassName('tab__url')[0].textContent.trim()
  })

  const pins = tabs.filter(tab => {
    return tab.dataset.pinned == "true"
  })

  browser.windows.create({ url: urls }).then((newWindow) => {
    newWindow.tabs.slice(0, pins.length).map((tab, index) => {
      browser.tabs.update(tab.id, { pinned: true })
    })
  })
}

function displaySidebar () {
  const sidebar = document.querySelector('.sidebar__wrapper')
  const storage = browser.storage.local

  storage.get(null).then(sessions => {
    const stored = Object.keys(sessions).map(key => {
      let date = sessions[key][0].created.split(' ')
      date = `${date[1]} ${date[2]}`

      const color = colorAmount(sessions[key])

      return `<div data-session="${key}" class="saved">
        <div style="background-color:${color}" class="saved__color"></div>
        <a class="saved__name">${key}</a>
        <img src="images/icon__delete.svg" class="saved__delete"/>
        <div class="saved__meta">
          <a class="saved__amount"><span style="color:${color}" class="amount__number">${sessions[key].length} </span>${sessions[key].length > 1 ? 'Tabs' : 'Tab'}</a>
          <a class="saved__date">${date}</a>
        </div>
      </div>`
    }).join('')
    sidebar.innerHTML = stored

    sidebar.addEventListener('click', sidebarActions.bind(null, sessions), false)
  })
}

function colorAmount (array) {
  const color = array.length < 3 ? '#FDDC43' : array.length < 6 ? '#FCC257' : array.length < 9 ? '#FCB760'
    : array.length < 12 ? '#FCAC69' : array.length < 15 ? '#FBA072' : array.length < 18 ? '#FB967B' :
    array.length < 21 ? '#FB8B84' : array.length <= 24 ? '#FA808C' : array.length > 24 ? '#FA7198' : ''

  return color
}

function sidebarActions (sessionName, e) {
  const target = e.target.dataset.session || e.target.parentNode.dataset.session

  if (e.target.classList.contains('saved__delete')) {
    deleteSession(target)

  } else if (e.target.parentNode.classList.contains('saved') || e.target.classList.contains('saved') || e.target.classList.contains('saved__meta')) {
    displaySession(sessionName[target])

    document.querySelector('#session__namer').style.display = 'none'
    document.querySelector('#session__name').style.display = 'block'

    document.querySelector('#session__name').innerHTML = target
  }
}

function deleteSession (sessionName) {
  browser.storage.local.remove(sessionName).then(item => {
    displaySidebar()
  })
}

function displaySession (array) {
  const tabs = document.querySelector('.tabs')

  tabs.innerHTML = array.map((tab, index) => {
    index++

    return `<li class="tab" data-pinned="${tab.pinned}">
      <a class="tab__number">${index}</a>
      <img type="image/ico" class="tab__favicon" src="${tab.favicon || ''}" />
      <div class="tab__links">
        <a class="tab__title">${tab.name}</a>
        <a class="tab__url" src="${tab.url}">${tab.url}</a>
      </div>
    </li>`
  }).join('')

  let multipleTabs =`${array.length > 1? 'Tabs' : 'Tab'}`

  if (multipleTabs) {
    document.querySelector('.session__amount').style.width = '91px'
    document.querySelector('.session__date').style.padding = '7.5px 10px'
  }

  document.querySelector('.session__amount').style.backgroundColor = colorAmount(array)
  document.querySelector('.session__save').style.backgroundColor = colorAmount(array)
  document.querySelector('.session__saveEdit').style.backgroundColor = colorAmount(array)

  document.querySelector('.session__amount').innerHTML = `<span class="amount__number session__number">${array.length}</span> ${multipleTabs} `
  document.querySelector('.session__date').innerHTML = array[0].created
}

function nameSession (resolve, elName, e) {
  if (elName.value.trim() === '') {
    elName.placeholder = `Can't be empty`
    return
  }
  resolve(elName.value)
}

function saveSession (array) {
  const elName = document.querySelector('#session__namer')
  const storage = browser.storage.local
  const saveButton = document.querySelector('.session__save')
  const name = elName.value

  if (name.trim() === '') {
    elName.placeholder = "Don't forget to name the session!"
    elName.focus()
    return
  }
  storage.set({ [name.trim().toUpperCase()]: array }).then(arr => {
    browser.runtime.reload()
  })
}

function searchSession (array) {
  const input = document.querySelector('.nav__search').value.toUpperCase()
  const sidebarWrapper = document.querySelector('.sidebar__wrapper')

  browser.storage.local.get(null).then(sessions => {
    const sessionsArray = Object.entries(sessions)

    const result =  sessionsArray.filter(obj => Object.keys(obj).some(key => obj[key].includes(input)))

    sidebarWrapper.innerHTML = result.map(saved => {
      const color = colorAmount(saved[1])

      let date = saved[1][0].created.split(' ')
      date = `${date[1]} ${date[2]}`

      return `<div data-session="${saved[0]}" class="saved">
        <div style="background-color:${color}" class="saved__color"></div>
        <a class="saved__name">${saved[0]}</a>
        <a class="saved__delete">x</a>
        <div class="saved__meta">
          <a class="saved__amount"><span class="amount__number">${sessions[saved[0]].length} </span>${sessions[saved[0]].length > 1? 'Tabs' : 'Tab'}</a>
          <a class="saved__date">${date}</a>
        </div>
      </div>`
    }).join('')
  })
}

function editSession () {
  const sessionName = document.querySelector('#session__name')
  const sessionNamer = document.querySelector('#session__namer')
  const tabs = Array(... document.querySelectorAll('.tab'))

  if (sessionName.style.display === 'none') {
    return
  }

  sessionName.style.display = 'none'
  sessionNamer.value = sessionName.innerHTML
  sessionNamer.focus()
  sessionNamer.style.display = 'block'

  document.querySelector('.save__overlay').style.display = 'none'
  document.querySelector('.saveEdit__overlay').style.display = 'block'

  tabs.map(tab => {
    const node = document.createElement('img')
    node.src = 'images/icon__delete.svg'
    node.classList.add('tab__delete')

    node.addEventListener('click', (e) => deleteTab(e))
    tab.appendChild(node)
  });
}

function deleteTab (e) {
  e.target.parentNode.remove()
}

function saveEdit () {
  const tabs = Array(... document.querySelectorAll('.tab'))
  const name = document.querySelector('#session__namer')
  const date = document.querySelector('.session__date').innerHTML

  if (name.value === '') {
    name.placeholder = "Don't forget to name the session!"
    return
  }

  const tabsObj = tabs.map(tab => {
    return new Tab(tab.childNodes[5].childNodes[1].textContent.trim(), tab.childNodes[5].childNodes[3].textContent.trim(), tab.childNodes[3].src, date, tab.pinned)
  })

  if (tabsObj.length < 1) {
    return
  }
  browser.storage.local.set({ [name.value.trim()]: tabsObj }).then(arr => {
    browser.runtime.reload()
  })
}
