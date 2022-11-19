import rdf from 'rdf-ext'
import { Transform } from 'readable-stream'

function mapDataset (map, { factory = rdf } = {}) {
  const mapper = mapQuad(map, { factory })

  return dataset => {
    return factory.dataset([...dataset].map(quad => mapper(quad)))
  }
}

function mapQuad (map, { factory = rdf } = {}) {
  const mapper = mapTerm(map, { factory })

  return quad => {
    const subject = mapper(quad.subject)
    const predicate = mapper(quad.predicate)
    const object = mapper(quad.object)
    const graph = mapper(quad.graph)

    if (subject === quad.subject && predicate === quad.predicate && object === quad.object && graph === quad.graph) {
      return quad
    }

    return factory.quad(subject, predicate, object, graph)
  }
}

function mapStream (map, { factory = rdf } = {}) {
  const mapper = mapQuad(map, { factory })

  return new Transform({
    objectMode: true,
    transform (quad, encoding, callback) {
      callback(null, mapper(quad))
    }
  })
}

function mapTerm (map, { factory = rdf } = {}) {
  return term => {
    if (!term) {
      return term
    }

    if (term.termType !== 'NamedNode') {
      return term
    }

    for (const [from, to] of map) {
      const fromStr = from.value || from.toString()

      if (term.value.startsWith(fromStr)) {
        const toStr = to.value || to.toString()

        return factory.namedNode(toStr + term.value.slice(fromStr.length))
      }
    }

    return term
  }
}

export {
  mapDataset,
  mapQuad,
  mapStream,
  mapTerm
}
