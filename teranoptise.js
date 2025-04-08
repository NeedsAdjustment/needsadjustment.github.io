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

// Function to generate a random snake eating segment based on direction
function generateEatingSegment(direction, used) {
  return randomChoice(eatingSegments[direction], used)
}

// Main function to generate the glyph string
function teranoptise(numChars, direction, portals = false) {
  const used = []

  if (numChars === 1) {
    const standalone = generateStandaloneOddity(used)
    used.push(standalone)
    return standalone
  } else if (numChars === 2) {
    const tail = generateTail(direction, portals, used)
    used.push(tail)
    const head = generateHead(direction, used)
    used.push(head)
    return tail + head
  } else {
    let result = ''
    let middleIndex = Math.floor((numChars - 2) / 2)
    let addEatingSegment = false

    // Generate tail
    let tail = generateTail(direction, portals, used)
    used.push(tail)
    result += tail

    // Determine if we should add the snake eating segment
    if (numChars > 3 && Math.random() < 1 / (bodySegments[direction].length + 1)) {
      addEatingSegment = true
    }

    // Generate body segments
    for (let i = 0; i < numChars - 2; i++) {
      let segment
      if (addEatingSegment && ((numChars >= 5 && i === middleIndex) || (numChars < 5 && i === numChars - 3))) {
        segment = generateEatingSegment(direction, used)
      } else {
        segment = generateBodySegment(direction, portals, used)
      }
      used.push(segment)
      result += segment
    }

    // Add special tail if needed when using snake eating segment
    if (addEatingSegment && numChars < 5) {
      direction = direction === 'right' ? 'left' : 'right'
      const specialTail = randomChoice(specialTails[direction], used)
      used.push(specialTail)
      result += specialTail
    } else {
      const head = generateHead(direction, used)
      used.push(head)
      result += head
    }

    return result
  }
}
