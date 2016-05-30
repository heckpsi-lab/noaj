N.debug = true;

new Compression(); // TypeScript Junk Code, just to get code covered

describe('Compression Engine', function () {
    it('compresses and uncompresses', function () {
        expect(Compression.decode(Compression.encode('Hello World.')))
            .toEqual('Hello World.');
        expect(Compression.decode(Compression.encode('Tinky-winky, Dipsy, Lala, Po.')))
            .toEqual('Tinky-winky, Dipsy, Lala, Po.');
        expect(Compression.decode(Compression.encode('The big brown fox jumps over a lazy dog.')))
            .toEqual('The big brown fox jumps over a lazy dog.');
        expect(Compression.decode(Compression.encode('你好，世界。')))
            .toEqual('你好，世界。');
        expect(Compression.decode(Compression.encode('我能吞下玻璃而不伤身体。')))
            .toEqual('我能吞下玻璃而不伤身体。');
    });

    it('\'s compression rate must be no larger than 1', function () {
        expect(Compression.benchmark('Hello World.'))
            .not.toBeGreaterThan(1);
        expect(Compression.benchmark('Tinky-winky, Dipsy, Lala, Po.'))
            .not.toBeGreaterThan(1);
        expect(Compression.benchmark('The big brown fox jumps over a lazy dog.'))
            .not.toBeGreaterThan(1);
        expect(Compression.benchmark('你好，世界。'))
            .not.toBeGreaterThan(1);
        expect(Compression.benchmark('{"glossary":{"title":"example glossary","GlossDiv":{"title":"S","GlossList":{"GlossEntry":{"ID":"SGML","SortAs":"SGML","GlossTerm":"Standard Generalized Markup Language","Acronym":"SGML","Abbrev":"ISO 8879:1986","GlossDef":{"para":"A meta-markup language, used to create markup languages such as DocBook.","GlossSeeAlso":["GML","XML"]},"GlossSee":"markup"}}}}}'))
            .not.toBeGreaterThan(1);
    })
});

describe('Virtual Request', function () {
    it('inits with selectable option', function () {
        expect(function () {
            N.request({
                route: '/',
                data: ''
            })
        }).not.toThrow();
    });

    it('sends without setting url', function () {
        expect(N.request({
            route: '/',
            data: '',
            success: function (data) { }
        }).send()).toBe(false);
    });
    
    it('sends securedly', function () {
        N.secured = true;
        expect(function () {
            N.compression = false;
            N.request({
                route: '/',
                data: '',
                success: function (data) { }
            }).send();
        }).not.toThrow();
        N.secured = false;
    });

    it('sends without compression', function () {
        expect(function () {
            N.compression = false;
            N.request({
                route: '/',
                data: '',
                success: function (data) { }
            }).send();
        }).not.toThrow();
    });

    it('sends with fallback AJAX', function () {
        expect(function () {
            N.request({
                route: '/',
                data: '',
                success: function (data) { }
            }).fallbackSend();
        }).not.toThrow();
    });

});

describe('Garbage Collection', function () {
    it('not throw exception when running', function () {
        expect(function () { N.gc() }).not.toThrow();
    })
});