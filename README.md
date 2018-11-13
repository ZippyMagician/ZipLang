<div align="center">
  <br />
  <p>
    <a href="https://npmjs.org/package/ziplang"><img src="https://raw.githubusercontent.com/ZippyMagician/ZipLang/master/files/ziplang.png" alt="ziplang" /></a>
  </p>
  <br />
  <p>
    <a href="https://travis-ci.org/ZippyMagician/ZipLang"><img src="https://travis-ci.org/ZippyMagician/ZipLang.svg" alt="Build status" /></a>
    <a href="https://david-dm.org/ZippyMagician/ZipLang"><img src="https://david-dm.org/ZippyMagician/ZipLang/status.svg" alt="Dependencies" /></a>
  </p>
  <p>
    <a href="https://nodei.co/npm/ZipLang/"><img src="https://nodei.co/npm/ziplang.png)](https://nodei.co/npm/ziplang/" alt="npm installnfo" /></a>
  </p>
</div>


## About
A programming language I wrote for fun, written in NodeJS
## How to install
To install, follow these steps:
- run `npm install -g ziplang` to install ZipLang globally
- ZipLang is now installed on your machine
## How to use
There are 2 different possibilites when running Ziplang. You can either execute _From the command line_ or _From a file_
The syntax would be:
```sh
ziplang <-f || -u || -i> [path]
```
-f [path] will run a file ending in _.zp_, and -u will enter user input mode. -i will __update ziplang__
## Syntax
The syntax for ZipLang is pretty simple, here is an excerpt from an example file
_Syntax.zp_
```ruby
a : "hello" # Regular variable definition #
b :: 7 # Constant variable definition #

c : 4
c +: 1 # Adds a value to a pre-determined variable #
c -: 1 # Subtracts a value from a pre-determined variable #

d : b + c # Math #

print d # Prints a string, int, bool, or equation #

print 84 / 2

inc : 1
loop 3 # Loop statement, repeats 3 times #
  print inc
  inc +: 1
end

def p(str string) # Function statement, uses syntax def [name]<vars> ... end #
  print str
end

p("Hello world!") # Calls a function #

e :: true # Boolean true #
f :: false # Boolean false #

if e != f then # If statement #
  print e
else # Else statement #
  print f
end

g : poke # User input #
h : 1

loop g
  if h % 2 == 0 then
    print "Fizz"
  end
  if h % 3 == 0 then
    print "Buzz"
  end
  if h % 5 == 0 then
    print "FizzBuzz"
  end

  h +: 1
end

# Creates an array #
array names("Joshua", "Jeff", "Justin", "Jimmy", "James", "Breckenridge")
i : 0

loop 6
  print names(i)
  i +: 1
end
```
## Why?
I made this to help myself better understand how programming languages work, which is mostly why the code is pretty bad
