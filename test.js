'use strict'

var test = require('tape')
var u = require('unist-builder')
var select = require('unist-util-select').select
var Index = require('.')

var index = Index

test('Index', function (t) {
  var node = {type: 'a', id: 1}
  var alt = {type: 'b', id: 1}
  var tree = {type: 'root', children: [node, alt]}
  var instance = index('id')
  instance.add(node)

  t.deepEqual(
    [instance instanceof Index, instance.get(1)],
    [true, [node]],
    'index(prop)'
  )

  instance = new Index('id')
  instance.add(node)

  t.deepEqual(
    [instance instanceof Index, instance.get(1)],
    [true, [node]],
    'new Index(prop)'
  )

  instance = index(keyFn)
  instance.add(node)

  t.deepEqual(
    [instance instanceof Index, instance.get(1)],
    [true, [node]],
    'index(keyFn)'
  )

  instance = new Index(keyFn)
  instance.add(node)

  t.deepEqual(
    [instance instanceof Index, instance.get(1)],
    [true, [node]],
    'new Index(keyFn)'
  )

  instance = index(tree, 'id')

  t.deepEqual(
    [instance instanceof Index, instance.get(1)],
    [true, [node, alt]],
    'index(tree, prop)'
  )

  instance = new Index(tree, 'id')

  t.deepEqual(
    [instance instanceof Index, instance.get(1)],
    [true, [node, alt]],
    'new Index(tree, prop)'
  )

  instance = index(tree, filter, 'id')

  t.deepEqual(
    [instance instanceof Index, instance.get(1)],
    [true, [node]],
    'index(tree, filter, prop)'
  )

  instance = new Index(tree, filter, 'id')

  t.deepEqual(
    [instance instanceof Index, instance.get(1)],
    [true, [node]],
    'new Index(tree, filter, prop)'
  )

  t.end()

  function keyFn(node) {
    return node.id
  }

  function filter(node) {
    return node.type === 'a'
  }
})

test('index.add', function (t) {
  var ast = u('root', [u('node', {word: 'foo'}), u('node', {word: 'bar'})])
  var extraNode = u('node', {word: 'foo'})

  var index = new Index(ast, 'word')
  t.deepEqual(index.get('foo'), [select('[word=foo]', ast)])

  var result = index.add(extraNode)
  t.deepEqual(index.get('foo'), [select('[word=foo]', ast), extraNode])

  t.equal(result, index, 'returns this')

  index.add(select('[word=foo]', ast))
  t.deepEqual(index.get('foo'), [select('[word=foo]', ast), extraNode])

  index.add(extraNode)
  t.deepEqual(index.get('foo'), [select('[word=foo]', ast), extraNode])

  t.end()
})

test('index.get', function (t) {
  t.test('get', function (st) {
    var ast = u('node', {color: 'black', id: 0}, [
      u('node', {color: 'black', id: 1}, [
        u('node', {color: 'red', id: 2}, [
          u('node', {color: 'black', id: 3}),
          u('node', {color: 'black', id: 4})
        ]),
        u('node', {color: 'black', id: 5})
      ]),
      u('node', {color: 'red', id: 6}, [
        u('node', {color: 'black', id: 7}, [
          u('node', {color: 'black', id: 8}),
          u('node', {color: 'black', id: 9})
        ]),
        u('node', {color: 'black', id: 10}, [
          u('node', {color: 'red', id: 11}, [
            u('node', {color: 'black', id: 12}),
            u('node', {color: 'black', id: 13})
          ]),
          u('node', {color: 'black', id: 14})
        ])
      ])
    ])

    var index = new Index(ast, 'color')

    st.deepEqual(index.get('black'), [
      select('[id=0]', ast),
      select('[id=1]', ast),
      select('[id=3]', ast),
      select('[id=4]', ast),
      select('[id=5]', ast),
      select('[id=7]', ast),
      select('[id=8]', ast),
      select('[id=9]', ast),
      select('[id=10]', ast),
      select('[id=12]', ast),
      select('[id=13]', ast),
      select('[id=14]', ast)
    ])

    st.deepEqual(index.get('red'), [
      select('[id=2]', ast),
      select('[id=6]', ast),
      select('[id=11]', ast)
    ])

    st.deepEqual(index.get('yellow'), [])

    st.end()
  })

  t.test('degenerate keys', function (st) {
    st.test('Object.prototype keys', function (sst) {
      var ast = u('node', {word: '__proto__', id: 0}, [
        u('node', {word: 'constructor', id: 1}),
        u('node', {word: 'toString', id: 2})
      ])
      var index = new Index(ast, 'word')

      sst.deepEqual(index.get('__proto__'), [select('[id=0]', ast)])
      sst.deepEqual(index.get('constructor'), [select('[id=1]', ast)])
      sst.deepEqual(index.get('toString'), [select('[id=2]', ast)])
      sst.end()
    })

    st.test('identity keys', function (sst) {
      var id1 = {foo: 'bar'}
      var id2 = {foo: 'bar'}
      var ast = u('root', [
        u('node', {word: false, id: 0}),
        u('node', {word: 'false', id: 1}),
        u('node', {word: 1, id: 2}),
        u('node', {word: '1', id: 3}),
        u('node', {word: id1, id: 4}),
        u('node', {word: id2, id: 5})
      ])
      var index = new Index(ast, 'word')

      sst.deepEqual(index.get(false), [select('[id=0]', ast)])
      sst.deepEqual(index.get('false'), [select('[id=1]', ast)])
      sst.deepEqual(index.get(1), [select('[id=2]', ast)])
      sst.deepEqual(index.get('1'), [select('[id=3]', ast)])
      sst.deepEqual(index.get(id1), [select('[id=4]', ast)])
      sst.deepEqual(index.get(id2), [select('[id=5]', ast)])
      sst.deepEqual(index.get({foo: 'bar'}), [])
      sst.end()
    })

    st.end()
  })

  t.test('empty index', function (st) {
    st.deepEqual(new Index(null, 'foo').get('bar'), [])
    st.deepEqual(new Index('foo').get('bar'), [])
    st.end()
  })

  t.test('Index filter', function (st) {
    var ast = u('root', [
      u('node', {word: 'foo'}),
      u('node', {word: 'bar'}),
      u('skip', {word: 'foo'}),
      u('skip', {word: 'bar'})
    ])

    st.test('type test', function (sst) {
      var index = new Index(ast, 'node', 'word')
      sst.deepEqual(index.get('foo'), [select('node[word="foo"]', ast)])
      sst.deepEqual(index.get('bar'), [select('node[word="bar"]', ast)])
      sst.end()
    })

    st.test('function test', function (sst) {
      var index = new Index(ast, filter, 'word')
      sst.deepEqual(index.get('foo'), [select('node[word="foo"]', ast)])
      sst.deepEqual(index.get('bar'), [select('node[word="bar"]', ast)])
      sst.end()

      function filter(node, index, parent) {
        return 'word' in node && index < 2 && parent.type === 'root'
      }
    })

    st.end()
  })

  t.test('computed keys', function (st) {
    var ast = u('root', {x: 0, y: 4, id: 0}, [
      u('node', {x: 3, y: 2, id: 1}),
      u('node', {x: 2, y: 2, id: 2}),
      u('node', {x: 3, y: 1, id: 3}),
      u('node', {x: 4, y: 1, id: 4})
    ])
    var index

    index = new Index(ast, xPlusY)
    st.deepEqual(index.get(4), [
      select('[id=0]', ast),
      select('[id=2]', ast),
      select('[id=3]', ast)
    ])
    st.deepEqual(index.get(0), [])
    st.deepEqual(index.get(5), [select('[id=1]', ast), select('[id=4]', ast)])

    st.deepEqual(new Index(ast, 'node', xPlusY).get(4), [
      select('[id=2]', ast),
      select('[id=3]', ast)
    ])

    st.end()

    function xPlusY(node) {
      return node.x + node.y
    }
  })

  t.end()
})

test('index.remove', function (t) {
  var ast = u('root', [
    u('bad', {word: 'foo'}),
    u('node', {word: 'foo'}),
    u('node', {word: 'bar'})
  ])

  var index = new Index(ast, 'word')
  t.deepEqual(index.get('foo'), [
    select('bad[word=foo]', ast),
    select('node[word=foo]', ast)
  ])

  var result = index.remove(select('bad', ast))
  t.deepEqual(index.get('foo'), [select('node[word=foo]', ast)])

  t.equal(result, index, 'returns this')

  index.remove(select('bad', ast))
  t.deepEqual(index.get('foo'), [select('node[word=foo]', ast)])

  index.remove(u('terrible', {word: 'baz'}))
  t.deepEqual(index.get('foo'), [select('node[word=foo]', ast)])

  index.remove(select('node[word=foo]', ast))
  t.deepEqual(index.get('foo'), [])

  t.end()
})
