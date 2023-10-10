#ifndef shapes
#define shapes
#include <iostream>
template<typename S>
class Shape 
{
public:
    virtual Shape Area() const = 0;
    virtual Shape Perimiter() const = 0;
};

template<typename S>
class Circle :public S<Shape> 
{
private:
    S radius;
public:
    Circle(S r):radius(r) {}
    S Area() const override
    {
        return 3.141592654 * radius * radius;
    }
    S Perimiter() const override 
    {
        return 3.141592654 * 2 * radius;
    }
};

template<typename S>
class Rectangle :public S<Shape>
{
private:
    S height;
    S width;
public:
    Rectangle(S h, S w) : height(h), width(w) {}
    S Area() const override
    {
        return height * width;
    }
    S Preimiter() const override
    {
        return (height + width) * 2;
    };
};

template<typename S>
class Square :public S<Shape>
{
private:
    S side;
public:
    Square(S s):side(s) {}
    S Area() const override
    {
        return side * side;
    }
    S Perimiter
    {
        return side * 4;
    }
};

#endif