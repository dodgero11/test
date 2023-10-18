#ifndef shapes
#define shapes
#include <iostream>
#include <vector>
#include <memory>
const double PI = 3.1415926535898;

template <typename S>
class Shape
{
public:
    virtual Area() const = 0;
    virtual Perimiter() const = 0;
};

template <typename S>
class Circle : public Shape<S>
{
private:
    S m_radius;

public:
    Circle(S r) : m_radius(r) {}
    S Area() const override
    {
        return (S)PI * m_radius * m_radius;
    }
    S Perimiter() const override
    {
        return (S)PI * 2 * m_radius;
    }
};

template <typename S>
class Rectangle : public Shape<S>
{
private:
    S m_height;
    S m_width;

public:
    Rectangle(S h, S w) : m_height(h), m_width(w) {}
    S Area() const override
    {
        return m_height * m_width;
    }
    S Perimiter() const override
    {
        return (m_height + m_width) * 2;
    };
};

template <typename S>
class Square : public Shape<S>
{
private:
    S m_side;

public:
    Square(S s) : m_side(s) {}
    S Area() const override
    {
        return m_side * m_side;
    }
    S Perimiter()
    {
        return 4 * m_side;
    }
};

template <typename S>
class ShapeList
{
    virtual std::unique_ptr<Shape<S>> createShape(std::ifstream &infile) = 0;
};

template <typename S>
class CircleList : public ShapeList<S>
{
public:
    std::unique_ptr<Shape<S>> createShape(std::ifstream &infile) override
    {
        S m_radius;
        infile >> m_radius;
        return std::make_unique<Circle<S>>(m_radius);
    }
};

template <typename S>
class RectangleList : public ShapeList<S>
{
public:
    std::unique_ptr<Shape<S>> createShape(std::ifstream &infile) override
    {
        S width;
        S height;
        infile >> height >> width;
        return std::make_unique<Rectangle<S>>(height, width);
    }
};

template <typename S>
class SquareList : public ShapeList<S>
{
public:
    std::unique_ptr<Shape<S>> createShape(std::ifstream &infile) override
    {
        S side;
        infile >> side;
        return std::make_unique<Square<S>>(side);
    }
};

#endif