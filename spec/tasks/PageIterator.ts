import {assert} from "chai";
import {Client} from "../../lib/src/index";
import { getClient } from "../test-helper";
import {PageIterator, PageCollection, PageIteratorCallback} from "../../lib/src/tasks/PageIterator";

declare const describe, it;

let client: Client = getClient();

let value = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const getPageCollection = () => {
    return {
        value: Object.assign([], value),
        additionalContent: "additional content"
    }
};

const getPageCollectionWithNext = () => {
    return {
        value: Object.assign([], value),
        "@odata.nextLink": "nextURL", 
        additionalContent: "additional content"
    }
};

const getEmptyPageCollection = () => {
    return {
        value: []
    }
};

const getEmptyPageCollectionWithNext = () =>{
    return {
        value: [],
        "@odata.nextLink": "nextURL"
    }
};

let truthyCallback: PageIteratorCallback = (data) => {
    return true;
};

let truthyCallbackCounter = 5;
let truthyCallbackWithCounter: PageIteratorCallback = (data) => {
    truthyCallbackCounter--;
    return true;
};

let halfWayCallbackCounter = 5;
let halfWayCallback: PageIteratorCallback = (data) => {
    halfWayCallbackCounter--;
    if(halfWayCallbackCounter === 0) {
        return false;
    } else {
        return true;
    }
};

describe("Constructor", function () {
    it("Should create instance without nextLink", () => {
        let pageIterator = new PageIterator(client, getPageCollection(), truthyCallback);
        assert.equal(pageIterator.constructor.name, "PageIterator");
    });

    it("Should create instance with nextLink", () => {
        let pageIterator = new PageIterator(client, getPageCollectionWithNext(), truthyCallback);
        assert.equal(pageIterator.constructor.name, "PageIterator");
    });
});

describe("iterationHelper", function() {
    it("Should iterate over complete collection", () => {
        truthyCallbackCounter = 10;
        let pageIterator = new PageIterator(client, getPageCollection(), truthyCallbackWithCounter);
        assert.isTrue(pageIterator.iterationHelper());
        assert.equal(truthyCallbackCounter, 0);
    });

    it("Should break in the middle of the iteration, this is done by returning red flag from the callback", () => {
        halfWayCallbackCounter = 5;
        let pageIterator = new PageIterator(client, getPageCollection(), halfWayCallback);
        assert.isFalse(pageIterator.iterationHelper());
        assert.equal(halfWayCallbackCounter, 0);
    });

    it("Should return false for iterating over empty collection", () => {
        let pageIterator = new PageIterator(client, getEmptyPageCollection(), truthyCallback);
        assert.isFalse(pageIterator.iterationHelper());
    });
});

describe("iterate", function() {
    it("Should iterate over a complete collection without nextLink", async () => {
        let pageIterator = new PageIterator(client, getPageCollection(), truthyCallback);
        try {
            await pageIterator.iterate();
        } catch (error) {
            throw error;
        }
    });

    it("Should break in the middle way", async () => {
        let pageIterator = new PageIterator(client, getPageCollection(), halfWayCallback);
        halfWayCallbackCounter = 5;
        try {
            await pageIterator.iterate();
            assert.equal(halfWayCallbackCounter, 0);
        } catch (error) {
            throw error;
        }
    });
});

describe("resume", function() {
    it("Should start from the place where it left the iteration", async () => {
        let pageIterator = new PageIterator(client, getPageCollection(), halfWayCallback);
        halfWayCallbackCounter = 5;
        try {
            await pageIterator.iterate();
            assert.equal(halfWayCallbackCounter, 0);
            halfWayCallbackCounter = 5;
            await pageIterator.resume();
            assert.equal(halfWayCallbackCounter, 0)
        } catch (error) {
            throw error;
        }
    });
});