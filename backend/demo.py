#!/usr/bin/env python3
"""
Demo script for the Fishing Lure Classification System
"""

from lure_classifier import FishingLureClassifier
import json

def main():
    print("🎣 Fishing Lure Classification System - Demo")
    print("=" * 50)
    
    # Initialize the classifier
    classifier = FishingLureClassifier()
    
    # Demo 1: Show available lure types
    print("\n📋 Available Lure Types:")
    print("-" * 30)
    lure_types = list(classifier.lure_database.keys())
    for i, lure_type in enumerate(lure_types, 1):
        print(f"{i:2d}. {lure_type}")
    
    # Demo 2: Show detailed information about a specific lure
    print("\n🔍 Detailed Lure Information - Spinnerbait:")
    print("-" * 50)
    spinnerbait_info = classifier.lure_database["Spinnerbait"]
    print(f"Target Species: {', '.join(spinnerbait_info['target_species'])}")
    print(f"Best Seasons: {', '.join(spinnerbait_info['best_seasons'])}")
    print(f"Water Temperature: {spinnerbait_info['best_conditions']['water_temperature_f']}°F")
    print(f"Depth Range: {spinnerbait_info['best_conditions']['depth_ft']} ft")
    print(f"Retrieve Styles: {', '.join(spinnerbait_info['retrieve_styles'])}")
    
    # Demo 3: Get lure recommendations
    print("\n🎯 Lure Recommendations Demo:")
    print("-" * 40)
    
    # Spring bass fishing in clear water
    conditions = {
        "season": "Spring",
        "water_clarity": "clear",
        "target_species": "Largemouth Bass"
    }
    
    print(f"Conditions: {conditions['season']}, {conditions['water_clarity']} water, targeting {conditions['target_species']}")
    
    recommendations = classifier.get_lure_recommendations(conditions)
    
    print("\nTop 3 Recommendations:")
    for i, rec in enumerate(recommendations[:3], 1):
        print(f"{i}. {rec['lure_type']} (Score: {rec['score']})")
        print(f"   Best Seasons: {', '.join(rec['info']['best_seasons'])}")
        print(f"   Water Clarity: {', '.join(rec['info']['best_conditions']['water_clarity'])}")
        print()
    
    # Demo 4: Simulate image analysis (without actual image)
    print("📸 Image Analysis Demo:")
    print("-" * 30)
    print("Note: This is a simulation since no actual image is provided.")
    print("In real usage, you would upload an image file.")
    
    # Demo 5: Show JSON output format
    print("\n📊 JSON Output Format Example:")
    print("-" * 40)
    
    # Create a sample analysis result
    sample_result = {
        "image_name": "demo_lure.jpg",
        "predicted_lure_type": "Lipless Crankbait",
        "confidence": 0.87,
        "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
        "best_seasons": ["Spring", "Fall", "Winter"],
        "best_conditions": {
            "water_clarity": ["clear", "stained", "muddy"],
            "water_temperature_f": "40-80",
            "depth_ft": "1-20",
            "structure_cover": ["weeds", "open water", "shoreline", "drop-offs"]
        },
        "retrieve_styles": ["Steady retrieve", "Stop and go", "Yo-yo retrieve"],
        "recommended_colors": {
            "clear_water": ["Natural shad", "Bluegill", "Silver"],
            "stained_water": ["Chartreuse", "Orange", "Red"],
            "muddy_water": ["Chartreuse", "Orange", "Red", "Black"]
        },
        "common_mistakes": ["Not varying retrieve", "Wrong color for conditions"],
        "notes": "Versatile lure that works year-round. Excellent for covering water."
    }
    
    print(json.dumps(sample_result, indent=2))
    
    # Demo 6: Show system capabilities
    print("\n🚀 System Capabilities:")
    print("-" * 30)
    print("✅ 13 lure types with comprehensive information")
    print("✅ Smart recommendations based on conditions")
    print("✅ Detailed fishing techniques and tips")
    print("✅ JSON export for data processing")
    print("✅ Web interface for easy use")
    print("✅ Command-line interface for automation")
    print("✅ Python API for integration")
    
    print("\n🎯 How to Use:")
    print("-" * 20)
    print("1. Web Interface: Run 'python app.py' and visit http://localhost:5000")
    print("2. Command Line: Use 'python cli.py --help' for options")
    print("3. Python API: Import FishingLureClassifier class")
    
    print("\n🔮 Next Steps:")
    print("-" * 20)
    print("• Install dependencies: pip install -r requirements.txt")
    print("• Start web server: python app.py")
    print("• Upload a fishing lure image for analysis")
    print("• Get personalized recommendations")
    
    print("\n🎣 Happy Fishing!")
    print("The system is ready to help you catch more fish!")

if __name__ == "__main__":
    main()

















