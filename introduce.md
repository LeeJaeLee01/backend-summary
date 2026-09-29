First, I want to introduce my full name. My name is PDC. I graduated with a Software Engineering degree from PTIT. I have over 4 years of experience with Node.js and Golang for backend, and React.js for frontend. I also have experience optimizing queries using indexes and partitioning in PostgreSQL. Besides being a developer, I also have experience with DevOps. I have implemented systems on EC2, and set up and configured them to ensure product quality. Currently, I always use AI assistants for work and coding to improve the speed and quality of projects.

## Practice questions

1. What are your strengths and weaknesses?
My strengths are studying and tackling new problems. I can learn new knowledge in a short time and apply it in practice. I can also adapt quickly to a new environment and communicate comfortably with everyone. For my weaknesses, I think my English communication is quite bad, but I am trying to improve my English skills.
2. What is the difference between Node.js and Golang in your projects?
In my projects, the biggest differences between Node.js and Golang are concurrency, typing, and how data and methods are organized.

For concurrency, Node.js runs JavaScript on a single-threaded event loop, which is good for I/O-heavy APIs. Golang uses goroutines and channels, so it handles many concurrent tasks and is better for CPU-heavy or high-concurrency backend services.

For language design, Node.js is dynamically typed and often uses classes or objects to group data and methods. Golang is statically typed and has no classes — it uses structs with method receivers instead. Golang also has explicit pointers to access a variable's memory address, while Node.js does not have pointer syntax. In JavaScript, primitives are passed by value, and objects are passed by reference. In Golang, values are passed by value; if I need to modify the original data, I pass a pointer.

In practice, I usually choose Node.js for fast API development and teams already using the JavaScript ecosystem, and Golang when I need stronger performance, clearer concurrency, and stricter typing.
3. When would you use an index vs partitioning in PostgreSQL?
I use an index in PostgreSQL when I need to find data with a WHERE condition. Indexing helps me improve search query performance, and it is usually applied to the id column and other search-related columns , for example name. For partitioning, it is used to split data in one table based on a condition, for example time. It helps improve table scans.

Full answer:
I use an index when queries often filter, join, or sort on specific columns and need to find a small set of rows quickly. Indexes help PostgreSQL avoid scanning the whole table. (Index giúp PostgreSQL tránh phải quét toàn bộ bảng) I usually create them on foreign keys, and columns that appear frequently in WHERE or JOIN conditions, such as id, email, or name. The trade-off (điểm đánh đổi) is that indexes make writes slower and use more storage, so I only add indexes that real queries need.

I use partitioning when a table becomes very large, for example millions or billions of rows, and most queries only need part of the data (và hầu hết các query chỉ cần 1 phần dữ liêụ). Partitioning splits one logical table into smaller physical parts based on a key (tách 1 logic của 1 bảng thành các phần vật lý nhỏ dựa trên 1 key), often by time range such as month or year. Then PostgreSQL can use partition pruning to scan only the relevant partitions instead of the entire table. Partitioning also helps with maintenance, like dropping old data by removing a partition. (thường theo khảng thời gian tháng hoặc năm. Khi đó postgresSQL có thể dùng partition pruning để chỉ scan các partition liên quan thay vì toàn bộ bảng. Partitioning cũng giúp việc bảo trì dễ hơn ví dụ xóa dữ liệu cũ bằng cách gỡ 1 )

In short, indexes optimize row lookup inside a table, while partitioning manages large datasets by dividing the table. They solve different problems and are often used together. (tóm lại, indexes tối ưu việc tìm row bên trong 1 bảng, còn partitioning quản lý tập dữ liệu datase lớn bằng cách chia bảng. Chúng giải quyết các vấn đề khác nhau và thường được dùng kết hợp với nhau)
4. Can you describe a system you deployed on EC2?
To deploy on EC2, I built a Dockerfile and a Docker Compose file. In Docker Compose, I defined the backend, database, and Redis services. 

5. How do you ensure product quality in a DevOps workflow?
6. How do you use AI assistants to improve speed and quality without reducing code quality?
7. Tell me about a performance issue you solved with query optimization.
8. Prefer backend or frontend? Why?
9. What is your strongest technical skill, and why?
10. Tell me about a project you worked on that you know best.
