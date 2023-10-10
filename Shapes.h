#ifndef shapes
#define shapes
#include <iostream>
template<typename S>
class Shape 
{
public:
    virtual Shape Area() const=0;
    virtual Shape Perimiter() const=0;
};

template<typename S>
class Circle:public S<Shape> 
{
private:
    S radius;
public:
    Circle(T r):radius(r) {}
    S area() const override {
        return 3.141592654*radius*radius;
    }
};

template<typename S>
class 
#endif