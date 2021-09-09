import rdf from 'rdf-ext'
import { Transform } from 'readable-stream'

function mapDataset (dataset, from, to, { factory = rdf } = {}) {
  return factory.dataset([...dataset].map(quad => mapQuad(quad, from, to, { factory })))
}

function mapQuad (quad, from, to, { factory = rdf } = {}) {
  const subject = mapTerm(quad.subject, from, to, { factory })
  const predicate = mapTerm(quad.predicate, from, to, { factory })
  const object = mapTerm(quad.object, from, to, { factory })
  const graph = mapTerm(quad.graph, from, to, { factory })

  if (subject === quad.subject && predicate === quad.predicate && object === quad.object && graph === quad.graph) {
    return quad
  }

  return factory.quad(subject, predicate, object, graph)
}

function mapStream (from, to, { factory = rdf } = {}) {
  return new Transform({
    objectMode: true,
    transform (quad, encoding, callback) {
      callback(null, mapQuad(quad, from, to, { factory }))
    }
  })
}

function mapTerm (term, from, to, { factory = rdf } = {}) {
  if (!term) {
    return term
  }

  if (term.termType !== 'NamedNode') {
    return term
  }

  const fromStr = from.value || from.toString()

  if (!term.value.startsWith(fromStr)) {
    return term
  }

  const toStr = to.value || to.toString()

  return factory.namedNode(toStr + term.value.slice(fromStr.length))
}

export {
  mapDataset,
  mapQuad,
  mapStream,
  mapTerm
}
