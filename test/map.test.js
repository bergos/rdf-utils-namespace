import { notStrictEqual, strictEqual } from 'assert'
import getStream from 'get-stream'
import { isDuplex } from 'isstream'
import { describe, it } from 'mocha'
import rdf from 'rdf-ext'
import { Readable } from 'readable-stream'
import { mapDataset, mapQuad, mapStream, mapTerm } from '../map.js'

const from = rdf.namedNode('http://example.org/')
const to = rdf.namedNode('http://example.com/')

describe('map', () => {
  describe('mapDataset', () => {
    it('should be a function', () => {
      strictEqual(typeof mapDataset, 'function')
    })

    it('should return a new Dataset object', () => {
      const dataset = rdf.dataset()

      const result = mapDataset(dataset, from, to)

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
        )
      ])

      const result = mapDataset(dataset, from, to)

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

      const result = mapQuad(quad, from, to)

      strictEqual(result, quad)
    })

    it('should map subjects', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${from.value}subject`),
        rdf.namedNode(`${to.value}predicate`),
        rdf.namedNode(`${to.value}object`),
        rdf.namedNode(`${to.value}graph`)
      )

      const result = mapQuad(quad, from, to)

      strictEqual(result.equals(expected), true)
    })

    it('should map predicates', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${to.value}subject`),
        rdf.namedNode(`${from.value}predicate`),
        rdf.namedNode(`${to.value}object`),
        rdf.namedNode(`${to.value}graph`)
      )

      const result = mapQuad(quad, from, to)

      strictEqual(result.equals(expected), true)
    })

    it('should map objects', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${to.value}subject`),
        rdf.namedNode(`${to.value}predicate`),
        rdf.namedNode(`${from.value}object`),
        rdf.namedNode(`${to.value}graph`)
      )

      const result = mapQuad(quad, from, to)

      strictEqual(result.equals(expected), true)
    })

    it('should map graph', () => {
      const quad = rdf.quad(
        rdf.namedNode(`${to.value}subject`),
        rdf.namedNode(`${to.value}predicate`),
        rdf.namedNode(`${to.value}object`),
        rdf.namedNode(`${from.value}graph`)
      )

      const result = mapQuad(quad, from, to)

      strictEqual(result.equals(expected), true)
    })
  })

  describe('mapStream', () => {
    it('should be a function', () => {
      strictEqual(typeof mapStream, 'function')
    })

    it('should return a Duplex stream', () => {
      const result = mapStream(from, to)

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
        )
      ]

      const result = await getStream.array(input.pipe(mapStream(from, to)))

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

      const result = mapTerm(term, from, to)

      strictEqual(result, term)
    })

    it('should ignore BlankNodes', () => {
      const term = rdf.blankNode()

      const result = mapTerm(term, from, to)

      strictEqual(result, term)
    })

    it('should ignore Literals', () => {
      const term = rdf.literal('test')

      const result = mapTerm(term, from, to)

      strictEqual(result, term)
    })

    it('should ignore NamedNodes with a different namespace', () => {
      const term = rdf.namedNode(`${to.value}test`)

      const result = mapTerm(term, from, to)

      strictEqual(result, term)
    })

    it('should support NamedNode from terms', () => {
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(term, from, to)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support URL from objects', () => {
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(term, new URL(from.value), to)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support from strings', () => {
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(term, from.value, to)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support NamedNode to terms', () => {
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(term, from, to)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support URL to objects', () => {
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(term, from, new URL(to.value))

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })

    it('should support to strings', () => {
      const term = rdf.namedNode(`${from.value}test`)

      const result = mapTerm(term, from, to.value)

      strictEqual(rdf.namedNode(`${to.value}test`).equals(result), true)
    })
  })
})
