module.exports = {
    ReadArgs: (argv, callback) => {
        for (var i in argv) {
            if (i === "f") return callback("-f", argv[i]);
            else if (i === "u") return callback("-u", argv[i]);
            else if (i === "i") return callback("update", argv[i]);
        }
    }
}