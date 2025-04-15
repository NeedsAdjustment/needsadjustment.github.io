// Utility function to select a random item from an array, excluding already used items
function randomChoice(arr, used) {
  const available = arr.filter((item) => !used.includes(item))
  return available[Math.floor(Math.random() * available.length)]
}

// Glyph categories
const standaloneOddities = ['*', ',', '-']
const tails = {
  right: ['L', 'A', 'C', 'v', 'F', 'I', 'O', 'S', 'W', 'Ź'],
  left: ['o', 'z', 'x', 'E', 'u', 'r', 'l', 'h', 'd', 'ż'],
}
const heads = {
  right: ['N', 'B', 'H', 'K', 'R', 'V', 'Z', 'Ż'],
  left: ['m', 'y', 's', 'p', 'i', 'e', 'a', 'ź'],
}
const bodySegments = {
  right: ['D', 'G', 'J', 'M', 'P', 'Q', 'T', 'U', 'X', 'Ž'],
  left: ['w', 't', 't', 'n', 'k', 'j', 'g', 'f', 'Y', 'b', 'c', 'ž'],
}
const eatingSegments = {
  right: ['Ẋ'],
  left: ['ḅ'],
}
const specialTails = {
  right: ['W', 'Ź', 'C'],
  left: ['d', 'ż', 'x'],
}
const portalEnds = {
  right: ['[', '{', '('],
  left: [']', '}', ')'],
}
const portalBodySegments = ['«', '»']

// Function to generate a random standalone oddity
function generateStandaloneOddity(used) {
  return randomChoice(standaloneOddities, used)
}

// Function to generate a random tail based on direction
function generateTail(direction, portals, used) {
  const availableTails = portals ? tails[direction].concat(portalEnds[direction]) : tails[direction]
  return randomChoice(availableTails, used)
}

// Function to generate a random head based on direction
function generateHead(direction, used) {
  return randomChoice(heads[direction], used)
}

// Function to generate a random body segment based on direction
function generateBodySegment(direction, portals, used) {
  const availableBodySegments = portals ? bodySegments[direction].concat(portalBodySegments) : bodySegments[direction]
  return randomChoice(availableBodySegments, used)
}

// Function to generate a random snake eating head based on direction
function generateEatingHead(direction, used) {
  if (direction === 'right') {
    // Check if the snake is eating to the right
    return randomChoice(eatingSegments.right, used) + randomChoice(specialTails.left, used)
  } else if (direction === 'left') {
    // Check if the snake is eating to the left
    return randomChoice(specialTails.right, used) + randomChoice(eatingSegments.left, used)
  }

  return randomChoice(eatingSegments[direction], used)
}

// Function to generate a random special tail based on direction
function generateSpecialTail(direction, used) {
  return randomChoice(specialTails[direction], used)
}

// Main function to generate the glyph string
function teranoptise(numChars, direction, portals = false) {
  const used = []

  if (numChars === 1) {
    const standalone = generateStandaloneOddity(used)
    return standalone
  } else {
    let result = ''
    let offset = 2

    // Determine if we should add the snake eating segment

    let head = ''
    if (numChars > 3 && Math.random() < 1 / (bodySegments[direction].length + 1)) {
      head = generateEatingHead(direction, used)
      offset = 3 // Adjust offset for the eating head
    } else {
      head = generateHead(direction, used)
    }
    used.push(head)
    const tail = generateTail(direction, portals, used)
    used.push(tail)

    // Generate body segments
    const body = []
    for (let i = 0; i < numChars - offset; i++) {
      let segment = generateBodySegment(direction, portals, used)
      used.push(segment)
      body.push(segment)
    }

    // Assemble the creature
    if (direction === 'right') {
      result = tail + body.join('') + head
    } else {
      result = head + body.join('') + tail
    }

    return result
  }
}

document.addEventListener('DOMContentLoaded', function () {
  let currentCreatureWidth = getCreatureWidth()
  updateCreatures(true)
  window.addEventListener('resize', function () {
    updateCreatures(false)
  })

  function getCreatureWidth() {
    const viewportWidth = window.innerWidth
    if (viewportWidth < 400) {
      return 0
    } else if (viewportWidth < 500) {
      return 1
    } else if (viewportWidth < 600) {
      return 2
    } else if (viewportWidth < 700) {
      return 3
    } else {
      return 4
    }
  }

  function updateCreatures(isInitialRender) {
    const newCreatureWidth = getCreatureWidth()
    if (isInitialRender || newCreatureWidth !== currentCreatureWidth) {
      const leftCreature = document.getElementById('leftCreature')
      const rightCreature = document.getElementById('rightCreature')
      if (newCreatureWidth === 0) {
        leftCreature.style.display = 'none'
        rightCreature.style.display = 'none'
      } else {
        leftCreature.style.display = ''
        rightCreature.style.display = ''
        leftCreature.innerText = teranoptise(newCreatureWidth, 'left', false)
        rightCreature.innerText = teranoptise(newCreatureWidth, 'right', false)
      }
      currentCreatureWidth = newCreatureWidth
    }
  }
})
