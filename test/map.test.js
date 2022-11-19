import { notStrictEqual, strictEqual } from 'assert'
import getStream from 'get-stream'
import { isDuplex } from 'isstream'
import { describe, it } from 'mocha'
import rdf from 'rdf-ext'
import { Readable } from 'readable-stream'
import { mapDataset, mapQuad, mapStream, mapTerm } from '../map.js'

const from = rdf.namedNode('http://abc.com/')
const to = rdf.namedNode('http://abc.org/')
const from2 = rdf.namedNode('http://xyz.com/')
const to2 = rdf.namedNode('http://xyz.org/')
const different = rdf.namedNode('http://def.com')

const map = new Map([
  [from, to],
  [from2, to2]
])

describe('map', () => {
  describe('mapDataset', () => {
    it('should be a function', () => {
      strictEqual(typeof mapDataset, 'function')
    })

    it('should return a new Dataset object', () => {
      const dataset = rdf.dataset()

      const result = mapDataset(map)(dataset)

      notStrictEqual(result, dataset)
    })

    it('should map all matching NamedNodes', () => {
      const dataset = rdf.dataset([
        rdf.quad(
          rdf.namedNode(`${from.value}subject1`),
          rdf.namedNode(`${from.value}predicate`),
          rdf.namedNode(`${to.value}object`),
          rdf.namedNode(`${to.value}graph`)
        ),
        rdf.quad(
          rdf.namedNode(`${to.value}subject2`),
          rdf.namedNode(`${to.value}predicate`),
          rdf.namedNode(`${from.value}object`),
          rdf.namedNode(`${from.value}graph`)
        ),
        rdf.quad(
          rdf.namedNode(`${from2.value}subject2`),
          rdf.namedNode(`${from2.value}predicate`),
          rdf.namedNode(`${from2.value}object`),
          rdf.namedNode(`${from2.value}graph`)
        )
      ])

      const expected = rdf.dataset([
        rdf.quad(
          rdf.namedNode(`${to.value}subject1`),
          rdf.namedNode(`${to.value}predicate`),
          rdf.namedNode(`${to.value}object`),
          rdf.namedNode(`${to.value}graph`)
        ),
        rdf.quad(
          rdf.namedNode(`${to.value}subject2`),
          rdf.namedNode(`${to.value}predicate`),
          rdf.namedNode(`${to.value}object`),
          rdf.namedNode(`${to.value}graph`)
        ),
        rdf.quad(
          rdf.namedNode(`${to2.value}subject2`),
          rdf.namedNode(`${to2.value}predicate`),
          rdf.namedNode(`${to2.value}object`),
          rdf.namedNode(`${to2.value}graph`)
        )
      ])

      const result = mapDataset(map)(dataset)

      strictEqual(result.toCanonical(), expected.toCanonical())
    })
  })

  describe('mapQuad', () => {
    const expected = rdf.quad(
      rdf.namedNode(`${to.value}subject`),
      rdf.namedNode(`${to.value}predicate`),
      rdf.namedNode(`${to.value}object`),
      rdf.namedNode(`${to.value}graph`)
    )

    const expected2 = rdf.quad(
      rdf.namedNode(`${to2.value}subject`),
      rdf.namedNode(`${to2.value}predicate`),
      rdf.namedNode(`${to2.value}object`),
      rdf.namedNode(`${to2.value}graph`)
    )

    it('should be a function', () => {
      strictEqual(typeof mapQuad, 'function')
    })

    it('should ignore Quads without NamedNode to map', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${to.value}subject`),
        rdf.namedNode(`${to.value}predicate`),
        rdf.namedNode(`${to.value}object`),
        rdf.namedNode(`${to.value}graph`)
      )

      const result = mapQuad(map)(quad)

      strictEqual(result, quad)
    })

    it('should map subjects', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${from.value}subject`),
        rdf.namedNode(`${to.value}predicate`),
        rdf.namedNode(`${to.value}object`),
        rdf.namedNode(`${to.value}graph`)
      )

      const result = mapQuad(map)(quad)

      strictEqual(result.equals(expected), true)
    })

    it('should map predicates', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${to.value}subject`),
        rdf.namedNode(`${from.value}predicate`),
        rdf.namedNode(`${to.value}object`),
        rdf.namedNode(`${to.value}graph`)
      )

      const result = mapQuad(map)(quad)

      strictEqual(result.equals(expected), true)
    })

    it('should map objects', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${to.value}subject`),
        rdf.namedNode(`${to.value}predicate`),
        rdf.namedNode(`${from.value}object`),
        rdf.namedNode(`${to.value}graph`)
      )

      const result = mapQuad(map)(quad)

      strictEqual(result.equals(expected), true)
    })

    it('should map graph', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${to.value}subject`),
        rdf.namedNode(`${to.value}predicate`),
        rdf.namedNode(`${to.value}object`),
        rdf.namedNode(`${from.value}graph`)
      )

      const result = mapQuad(map)(quad)

      strictEqual(result.equals(expected), true)
    })

    it('should map all defined pairs', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${from.value}subject`),
        rdf.namedNode(`${from.value}predicate`),
        rdf.namedNode(`${from.value}object`),
        rdf.namedNode(`${from.value}graph`)
      )

      const quad2 = rdf.quad(
        rdf.namedNode(`${from2.value}subject`),
        rdf.namedNode(`${from2.value}predicate`),
        rdf.namedNode(`${from2.value}object`),
        rdf.namedNode(`${from2.value}graph`)
      )

      const result = mapQuad(map)(quad)
      const result2 = mapQuad(map)(quad2)

      strictEqual(result.equals(expected), true)
      strictEqual(result2.equals(expected2), true)
    })
  })

  describe('mapStream', () => {
    it('should be a function', () => {
      strictEqual(typeof mapStream, 'function')
    })

    it('should return a Duplex stream', () => {
      const result = mapStream(map)

      strictEqual(isDuplex(result), true)
    })

    it('should map all matching NamedNodes', async () => {
      const input = Readable.from([
        rdf.quad(
          rdf.namedNode(`${from.value}subject1`),
          rdf.namedNode(`${from.value}predicate`),
          rdf.namedNode(`${to.value}object`),
          rdf.namedNode(`${to.value}graph`)
        ),
        rdf.quad(
          rdf.namedNode(`${to.value}subject2`),
          rdf.namedNode(`${to.value}predicate`),
          rdf.namedNode(`${from.value}object`),
          rdf.namedNode(`${from.value}graph`)
        ),
        rdf.quad(
          rdf.namedNode(`${from2.value}subject2`),
          rdf.namedNode(`${from2.value}predicate`),
          rdf.namedNode(`${from2.value}object`),
          rdf.namedNode(`${from2.value}graph`)
        )
      ])

      const expected = [
        rdf.quad(
          rdf.namedNode(`${to.value}subject1`),
          rdf.namedNode(`${to.value}predicate`),
          rdf.namedNode(`${to.value}object`),
          rdf.namedNode(`${to.value}graph`)
        ),
        rdf.quad(
          rdf.namedNode(`${to.value}subject2`),
          rdf.namedNode(`${to.value}predicate`),
          rdf.namedNode(`${to.value}object`),
          rdf.namedNode(`${to.value}graph`)
        ),
        rdf.quad(
          rdf.namedNode(`${to2.value}subject2`),
          rdf.namedNode(`${to2.value}predicate`),
          rdf.namedNode(`${to2.value}object`),
          rdf.namedNode(`${to2.value}graph`)
        )
      ]

      const result = await getStream.array(input.pipe(mapStream(map)))

      strictEqual(result[0].equals(expected[0]), true)
      strictEqual(result[1].equals(expected[1]), true)
    })
  })

  describe('mapTerm', () => {
    it('should be a function', () => {
      strictEqual(typeof mapTerm, 'function')
    })

    it('should ignore falsy values', () => {
      const term = null

      const result = mapTerm(map)(term)

      strictEqual(result, term)
    })

    it('should ignore BlankNodes', () => {
      const term = rdf.blankNode()

      const result = mapTerm(map)(term)

      strictEqual(result, term)
    })

    it('should ignore Literals', () => {
      const term = rdf.literal('test')

      const result = mapTerm(map)(term)

      strictEqual(result, term)
    })

    it('should ignore NamedNodes with a different namespace', () => {
      const term = rdf.namedNode(`${different.value}test`)

      const result = mapTerm(map)(term)

      strictEqual(result, term)
    })

    it('should support NamedNode from terms', () => {
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(map)(term)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support URL from objects', () => {
      const map = new Map([[new URL(from.value), to]])
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(map)(term)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support from strings', () => {
      const map = new Map([[from.value, to]])
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(map)(term)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support NamedNode to terms', () => {
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(map)(term)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support URL to objects', () => {
      const map = new Map([[from, new URL(to.value)]])
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(map)(term)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support to strings', () => {
      const map = new Map([[from, to.value]])
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(map)(term)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should map all defined pairs', () => {
      const term = rdf.namedNode(`${from.value}test`)
      const term2 = rdf.namedNode(`${from2.value}test`)
      const mapper = mapTerm(map)

      const result = mapper(term)
      const result2 = mapper(term2)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
      strictEqual(rdf.namedNode(`${to2.value}test`).equals(result2), true)
    })
  })
})
