# Beat Planning Algorithm Documentation

A comprehensive Vehicle Routing Problem (VRP) solver for optimizing sales territory coverage using Google OR-Tools.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Input Format](#input-format)
- [Output Format](#output-format)
- [Configuration Options](#configuration-options)
- [Use Cases & Examples](#use-cases--examples)
- [Troubleshooting](#troubleshooting)
- [Performance Tips](#performance-tips)

## Overview

The Beat Planning Algorithm solves the complex problem of assigning optimal routes to sales teams while respecting real-world constraints like working hours, travel distance, and geographic distribution. It uses Google OR-Tools' Vehicle Routing Problem solver to provide mathematically optimized solutions.

### Key Features
- **Multi-depot routing**: Support for multiple starting points
- **Constraint handling**: Time, distance, and capacity constraints
- **Partial coverage**: Handles scenarios where not all stores can be visited
- **Smart suggestions**: Automatic recommendations for constraint adjustments
- **Export capabilities**: CSV output for integration with other systems
- **Real-world optimization**: Uses geodesic distances and realistic travel times

### Algorithm Type
- **Primary**: Vehicle Routing Problem (VRP) with Time Windows
- **Optimization Goal**: Minimize total travel distance/time
- **Constraint Type**: Hard constraints (must be satisfied)
- **Solver**: Google OR-Tools Constraint Programming

## Installation

### Prerequisites
```bash
pip install ortools pandas geopy numpy
```

### System Requirements
- Python 3.7+
- Memory: ~100MB per 1000 locations
- OS: Windows, macOS, Linux

### Installation Steps
1. Install dependencies
2. Save the beat planning module as `beat_planning.py`
3. Prepare your location data in CSV format

## Quick Start

### 1. Prepare Your Data
Create a CSV file with the following structure:

```csv
node,lat,long,node_type
depot_north,28.7041,77.1025,starting_point
depot_south,28.5355,77.3910,starting_point
store_001,28.6139,77.2090,store
store_002,28.6219,77.2419,store
```

### 2. Basic Usage
```python
from beat_planning import EnhancedBeatPlanningOptimizer

# Initialize optimizer
optimizer = EnhancedBeatPlanningOptimizer('locations.csv')

# Solve beat planning
solution = optimizer.solve_beat_planning(
    num_salespeople=3,
    daily_working_hours=8,
    max_daily_distance_km=150
)

# Print results
optimizer.print_solution(solution)

# Export to CSV
if solution:
    optimizer.export_routes_to_csv(solution, 'daily_routes.csv')
```

### 3. Expected Output
```
BEAT PLANNING OPTIMIZATION RESULTS
==================================================
SUMMARY:
Total Stores Covered: 45/50 (90.0%)
Total Distance: 420.50 km
Total Time: 22.30 hours
Avg Distance per Salesperson: 140.17 km
Avg Time per Salesperson: 7.43 hours

ROUTE DETAILS:
Salesperson 1:
  Distance: 145.20 km
  Time: 7.80 hours
  Stores Visited: 15
  Route: depot_north -> store_001 -> store_005 -> depot_north
```

## API Reference

### EnhancedBeatPlanningOptimizer

#### Constructor
```python
EnhancedBeatPlanningOptimizer(csv_file_path)
```

**Parameters:**
- `csv_file_path` (str): Path to CSV file with location data

**Raises:**
- `FileNotFoundError`: If CSV file doesn't exist
- `KeyError`: If required columns are missing

#### Primary Methods

##### solve_beat_planning()
```python
solve_beat_planning(
    num_salespeople,
    target_stores_per_day=None,
    daily_working_hours=8,
    max_daily_distance_km=200,
    allow_partial_coverage=True
)
```

**Parameters:**
- `num_salespeople` (int): Number of sales team members
- `target_stores_per_day` (int, optional): Target visits per day (not currently implemented)
- `daily_working_hours` (int): Maximum working hours per day (default: 8)
- `max_daily_distance_km` (int): Maximum travel distance per day in km (default: 200)
- `allow_partial_coverage` (bool): Whether to accept solutions that don't cover all stores (default: True)

**Returns:**
- `dict`: Complete solution with routes, summary, and uncovered stores
- `None`: If no solution found

##### print_solution()
```python
print_solution(solution)
```
Prints formatted solution to console including uncovered stores and improvement suggestions.

##### export_routes_to_csv()
```python
export_routes_to_csv(solution, filename='beat_planning_output.csv')
```
Exports solution to CSV files for external use.

#### Utility Methods

##### _create_distance_matrix()
Creates distance matrix using geodesic calculations (haversine formula).

##### _create_time_matrix()
Converts distances to time using configurable average speed (default: 40 km/h).

##### _analyze_uncovered_reason()
Analyzes why specific stores couldn't be included in routes.

## Input Format

### CSV Schema
```csv
node,lat,long,node_type
```

**Columns:**
- `node` (str): Unique identifier for location
- `lat` (float): Latitude in decimal degrees
- `long` (float): Longitude in decimal degrees  
- `node_type` (str): Either "starting_point" or "store"

### Requirements
- **Minimum**: 1 starting point, 1 store
- **Maximum**: Limited by available memory (~1000 locations recommended)
- **Coordinates**: Valid lat/long in decimal degrees
- **Node names**: Must be unique across all locations

### Example Valid Data
```csv
node,lat,long,node_type
hq_delhi,28.6139,77.2090,starting_point
branch_gurgaon,28.4595,77.0266,starting_point
mall_cp,28.6315,77.2167,store
market_lajpat,28.5678,77.2435,store
shop_karol,28.6667,77.1917,store
```

## Output Format

### Solution Dictionary Structure
```python
{
    'total_distance': int,      # Total distance in meters
    'total_time': int,          # Total time in minutes
    'routes': [                 # List of route objects
        {
            'vehicle_id': int,           # Salesperson ID (0-indexed)
            'route': [                   # Ordered list of locations
                {
                    'node': str,         # Location identifier
                    'lat': float,        # Latitude
                    'long': float,       # Longitude
                    'type': str          # "starting_point" or "store"
                }
            ],
            'distance': int,             # Route distance in meters
            'time': int,                 # Route time in minutes
            'stores_visited': int        # Number of stores in route
        }
    ],
    'summary': {                # Aggregated metrics
        'total_distance_km': float,
        'total_time_hours': float,
        'total_stores_covered': int,
        'avg_distance_per_salesperson': float,
        'avg_time_per_salesperson': float,
        'coverage_percentage': float,
        'uncovered_count': int
    },
    'uncovered_stores': [       # Stores that couldn't be visited
        {
            'node': str,
            'lat': float,
            'long': float,
            'reason': str
        }
    ],
    'improvement_suggestions': { # Optimization recommendations
        'current_coverage': float,
        'uncovered_stores': int,
        'suggestions': [str]
    }
}
```

### CSV Export Format

#### Main Routes File
```csv
salesperson_id,sequence,node,lat,long,type,route_total_distance_km,route_total_time_hours
1,1,depot_north,28.7041,77.1025,starting_point,145.2,7.8
1,2,store_001,28.6139,77.2090,store,145.2,7.8
1,3,store_002,28.6219,77.2419,store,145.2,7.8
```

#### Uncovered Stores File  
```csv
node,lat,long,reason
store_050,28.8000,77.4000,Distance constraint exceeded (needs 220.0 km, limit: 200 km)
store_049,28.7500,77.4500,Time constraint exceeded (needs 9.5 hours, limit: 8 hours)
```

## Configuration Options

### Constraint Parameters

#### Time Constraints
- **daily_working_hours**: Maximum working hours per salesperson
- **service_time**: Time spent at each store (default: 30 minutes)
- **avg_speed_kmh**: Average travel speed for time calculations (default: 40 km/h)

#### Distance Constraints  
- **max_daily_distance_km**: Maximum travel distance per salesperson
- **distance_calculation**: Uses geodesic distance (most accurate for lat/long)

#### Coverage Options
- **allow_partial_coverage**: Accept solutions with uncovered stores
- **optimization_time_limit**: OR-Tools solver time limit (default: 30 seconds)

### Advanced Configuration
```python
# Custom service time and speed
optimizer = EnhancedBeatPlanningOptimizer('locations.csv')

# Modify internal parameters before solving
solution = optimizer.solve_beat_planning(
    num_salespeople=4,
    daily_working_hours=10,      # Extended hours
    max_daily_distance_km=300    # Longer routes allowed
)
```

## Use Cases & Examples

### Use Case 1: Urban Sales Team
**Scenario**: 5 salespeople, dense urban area, short distances

```python
optimizer = EnhancedBeatPlanningOptimizer('urban_stores.csv')
solution = optimizer.solve_beat_planning(
    num_salespeople=5,
    daily_working_hours=8,
    max_daily_distance_km=80   # Short urban routes
)
```

**Expected Results**:
- High store density per route
- Multiple stores per salesperson
- Efficient city-center coverage

### Use Case 2: Rural Sales Coverage
**Scenario**: 2 salespeople, sparse rural area, long distances

```python
solution = optimizer.solve_beat_planning(
    num_salespeople=2,
    daily_working_hours=10,    # Longer working day
    max_daily_distance_km=400  # Long rural routes
)
```

**Expected Results**:
- Fewer stores per route
- Longer travel times between locations
- May require multiple days for full coverage

### Use Case 3: Multi-City Operations
**Scenario**: 3 cities, dedicated teams per city

```python
# Separate CSV for each city, or use multiple starting points
solution = optimizer.solve_beat_planning(
    num_salespeople=6,         # 2 per city
    daily_working_hours=8,
    max_daily_distance_km=150
)
```

### Use Case 4: Constraint Testing
**Scenario**: Find optimal team size for given constraints

```python
# Test different team sizes
for team_size in range(2, 8):
    solution = optimizer.solve_beat_planning(
        num_salespeople=team_size,
        daily_working_hours=8,
        max_daily_distance_km=120
    )
    
    if solution:
        coverage = solution['summary']['coverage_percentage']
        print(f"Team size {team_size}: {coverage:.1f}% coverage")
        
        if coverage >= 95:  # Found optimal size
            break
```

## Troubleshooting

### Common Errors

#### 1. "Check failed: starts.size() == num_vehicles"
**Cause**: More salespeople than starting points
**Solution**: The enhanced version handles this automatically by sharing depots

#### 2. "No solution found!"
**Cause**: Constraints too restrictive
**Solutions**:
- Increase `daily_working_hours`
- Increase `max_daily_distance_km`
- Add more salespeople
- Add more starting points

#### 3. Low Coverage Percentage
**Cause**: Constraints don't allow reaching all stores
**Solutions**:
- Check improvement suggestions in output
- Analyze uncovered stores reasons
- Consider multi-day planning

#### 4. CSV Reading Errors
**Common Issues**:
```python
# Wrong column names
# Should be: node,lat,long,node_type
# Not: id,latitude,longitude,type

# Missing node_type values
# Each row must have either "store" or "starting_point"

# Duplicate node names
# All node identifiers must be unique
```

### Performance Issues

#### Large Dataset Optimization
```python
# For 500+ locations, increase solver time
search_parameters.time_limit.FromSeconds(120)  # 2 minutes

# Or use hierarchical approach
# 1. Cluster stores geographically
# 2. Solve smaller subproblems
# 3. Combine solutions
```

#### Memory Management
- **Guideline**: ~1MB per 100 locations
- **Limit**: 1000 locations on standard hardware
- **Optimization**: Pre-filter distant stores

### Data Quality Checks
```python
def validate_data(csv_path):
    df = pd.read_csv(csv_path)
    
    # Check required columns
    required_cols = ['node', 'lat', 'long', 'node_type']
    missing_cols = set(required_cols) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing columns: {missing_cols}")
    
    # Check for duplicates
    duplicates = df['node'].duplicated().sum()
    if duplicates > 0:
        raise ValueError(f"Found {duplicates} duplicate node names")
    
    # Check coordinate ranges
    if not df['lat'].between(-90, 90).all():
        raise ValueError("Invalid latitude values")
    
    if not df['long'].between(-180, 180).all():
        raise ValueError("Invalid longitude values")
    
    # Check node types
    valid_types = {'store', 'starting_point'}
    invalid_types = set(df['node_type']) - valid_types
    if invalid_types:
        raise ValueError(f"Invalid node_type values: {invalid_types}")
    
    print("Data validation passed!")
```

## Performance Tips

### Optimization Strategies

#### 1. Geographic Pre-clustering
```python
# For large datasets, pre-cluster stores by geography
from sklearn.cluster import KMeans

def pre_cluster_stores(df, num_clusters):
    store_coords = df[df['node_type'] == 'store'][['lat', 'long']].values
    kmeans = KMeans(n_clusters=num_clusters)
    clusters = kmeans.fit_predict(store_coords)
    return clusters
```

#### 2. Constraint Tuning
- Start with relaxed constraints, then tighten
- Use coverage percentage to guide adjustments
- Balance between optimization time and solution quality

#### 3. Multi-day Planning
```python
def multi_day_planning(optimizer, days=5):
    stores_per_day = len(optimizer.stores) // days
    
    daily_solutions = []
    remaining_stores = optimizer.stores.copy()
    
    for day in range(days):
        # Select subset of stores for this day
        day_stores = remaining_stores.head(stores_per_day)
        
        # Create temporary optimizer for this subset
        # Solve and store solution
        # Remove covered stores from remaining_stores
        
    return daily_solutions
```

#### 4. Solver Configuration
```python
# Fine-tune OR-Tools parameters
search_parameters = pywrapcp.DefaultRoutingSearchParameters()
search_parameters.first_solution_strategy = (
    routing_enums_pb2.FirstSolutionStrategy.AUTOMATIC  # Let OR-Tools choose
)
search_parameters.local_search_metaheuristic = (
    routing_enums_pb2.LocalSearchMetaheuristic.AUTOMATIC
)
search_parameters.time_limit.FromSeconds(60)  # Adjust based on problem size
```

### Scaling Guidelines

| Stores | Salespeople | Expected Time | Memory Usage |
|---------|-------------|---------------|--------------|
| 50      | 3-5         | <10 seconds   | ~50MB       |
| 200     | 5-10        | 30-60 seconds | ~200MB      |
| 500     | 10-20       | 2-5 minutes   | ~500MB      |
| 1000+   | 20+         | 5+ minutes    | 1GB+        |

---

## Support & Contributing

### Getting Help
- Check troubleshooting section for common issues
- Validate input data format
- Review constraint reasonableness
- Test with smaller datasets first

### Performance Monitoring
```python
import time

start_time = time.time()
solution = optimizer.solve_beat_planning(...)
solve_time = time.time() - start_time

print(f"Optimization completed in {solve_time:.2f} seconds")
if solution:
    print(f"Coverage: {solution['summary']['coverage_percentage']:.1f}%")
```

This documentation provides comprehensive guidance for implementing and using the beat planning algorithm effectively. For specific use cases or advanced customizations, refer to the troubleshooting section and performance tips.