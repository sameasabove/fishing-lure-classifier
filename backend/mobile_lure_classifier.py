#!/usr/bin/env python3
"""
Mobile-Optimized Lure Classifier: ChatGPT Vision + Comprehensive Fishing Database
Designed for mobile apps with API-first architecture
"""

import json
import os
import requests
from typing import Dict, List
import base64
from PIL import Image
import datetime
import config

class MobileLureClassifier:
    def __init__(self, openai_api_key: str = None):
        self.openai_api_key = openai_api_key
        self.lure_database = self._initialize_lure_database()
        self.analysis_history = []
        
    def _initialize_lure_database(self) -> Dict:
        """Initialize comprehensive database of fishing lure characteristics with expanded subcategories"""
        return {
            # SPINNERBAITS
            "Single Blade Spinnerbait": {
                "description": "Spinnerbait with one metallic spinning blade, typically Colorado or Indiana style",
                "visual_features": ["single blade", "jig head", "skirt", "wire arm", "metallic blade"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Northern Pike", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "2-15",
                    "structure_cover": ["weeds", "rocks", "wood", "shoreline"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Slow roll"],
                "recommended_colors": {
                    "clear_water": ["White", "Chartreuse", "Silver", "Blue"],
                    "stained_water": ["Chartreuse", "Orange", "Red", "Black"],
                    "muddy_water": ["Chartreuse", "Orange", "Red", "Black", "White"]
                },
                "common_mistakes": ["Retrieving too fast", "Using wrong blade size", "Not varying retrieve"],
                "notes": "Great for clear water and when you want less vibration. Colorado blades create more thump, Indiana blades less."
            },
            "Double Blade Spinnerbait": {
                "description": "Spinnerbait with two spinning blades for maximum flash and vibration",
                "visual_features": ["two blades", "jig head", "skirt", "wire arm", "multiple metallic blades"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Northern Pike", "Musky"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["stained", "muddy"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "2-15",
                    "structure_cover": ["weeds", "rocks", "wood", "shoreline"]
                },
                "retrieve_styles": ["Steady retrieve", "Burning retrieve", "Stop and go"],
                "recommended_colors": {
                    "clear_water": ["White", "Chartreuse", "Silver"],
                    "stained_water": ["Chartreuse", "Orange", "Red", "Black"],
                    "muddy_water": ["Chartreuse", "Orange", "Red", "Black", "White"]
                },
                "common_mistakes": ["Retrieving too fast", "Not matching blade sizes", "Wrong color for conditions"],
                "notes": "Excellent for stained and muddy water. Creates maximum flash and vibration to attract fish."
            },
            "Inline Spinner": {
                "description": "Straight wire spinner with blade that spins around the shaft, typically smaller than spinnerbaits",
                "visual_features": ["straight wire", "spinning blade", "single hook", "bead", "body"],
                "target_species": ["Trout", "Smallmouth Bass", "Northern Pike", "Panfish", "Walleye"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "40-75",
                    "depth_ft": "1-10",
                    "structure_cover": ["open water", "current", "rocks", "shoreline"]
                },
                "retrieve_styles": ["Steady retrieve", "Slow retrieve", "Stop and go"],
                "recommended_colors": ["Silver", "Gold", "Copper", "Chartreuse", "White"],
                "common_mistakes": ["Retrieving too fast", "Wrong size for target species", "Not matching the hatch"],
                "notes": "Versatile lure for multiple species. Great for trout and smallmouth bass in streams and rivers."
            },
            "Spinnerbait": {
                "description": "Long, thin lure with metallic spinning blades, typically has a jig head and skirt",
                "visual_features": ["spinning blades", "long body", "metallic parts", "jig head", "skirt"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Northern Pike", "Spotted Bass", "Musky"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "2-15",
                    "structure_cover": ["weeds", "rocks", "wood", "shoreline"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Slow roll", "Burning retrieve"],
                "recommended_colors": {
                    "clear_water": ["White", "Chartreuse", "Silver", "Blue"],
                    "stained_water": ["Chartreuse", "Orange", "Red", "Black"],
                    "muddy_water": ["Chartreuse", "Orange", "Red", "Black", "White"]
                },
                "common_mistakes": ["Retrieving too fast", "Not varying retrieve speed", "Using wrong blade size for conditions"],
                "notes": "Excellent for covering water quickly. Vary blade sizes based on water clarity and fish activity."
            },
            
            # CRANKBAITS
            "Deep Diving Crankbait": {
                "description": "Crankbait with large diving lip designed to reach depths of 10-25 feet",
                "visual_features": ["large diving lip", "rounded body", "fish-like shape", "deep diving design"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Walleye", "Striped Bass"],
                "best_seasons": ["Spring", "Fall", "Winter"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "45-75",
                    "depth_ft": "10-25",
                    "structure_cover": ["drop-offs", "deep structure", "ledges", "points"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Bouncing off structure"],
                "recommended_colors": ["Natural shad", "Crawfish", "Bluegill", "Chartreuse", "Firetiger"],
                "common_mistakes": ["Not reaching target depth", "Retrieving too fast", "Wrong color for depth"],
                "notes": "Perfect for targeting deep structure and suspended fish. Use long casts and steady retrieve."
            },
            "Shallow Crankbait": {
                "description": "Crankbait with small diving lip that runs 1-5 feet deep",
                "visual_features": ["small diving lip", "rounded body", "fish-like shape", "shallow running"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "50-80",
                    "depth_ft": "1-5",
                    "structure_cover": ["rocks", "wood", "shoreline", "weeds"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Bouncing off structure"],
                "recommended_colors": ["Natural shad", "Crawfish", "Bluegill", "Chartreuse"],
                "common_mistakes": ["Retrieving too fast", "Not deflecting off structure", "Wrong depth"],
                "notes": "Great for shallow water and deflecting off cover. Perfect for spring and fall bass fishing."
            },
            "Squarebill Crankbait": {
                "description": "Crankbait with square-shaped diving bill designed to deflect off wood and rocks",
                "visual_features": ["square diving bill", "rounded body", "deflecting design", "hooks"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "50-75",
                    "depth_ft": "1-8",
                    "structure_cover": ["wood", "rocks", "stumps", "brush piles"]
                },
                "retrieve_styles": ["Bouncing off structure", "Steady retrieve", "Stop and go"],
                "recommended_colors": ["Natural shad", "Crawfish", "Bluegill", "Chartreuse", "Red"],
                "common_mistakes": ["Not deflecting off structure", "Retrieving too fast", "Wrong color"],
                "notes": "Designed to bounce off cover without snagging. The square bill creates erratic action that triggers strikes."
            },
            "Lipless Crankbait": {
                "description": "Crankbait without a diving lip, sinks and creates vibration when retrieved",
                "visual_features": ["no diving lip", "rectangular body", "rattles", "sinking design"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Striped Bass"],
                "best_seasons": ["Spring", "Fall", "Winter"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "40-75",
                    "depth_ft": "2-20",
                    "structure_cover": ["grass", "rocks", "drop-offs", "open water"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Yo-yo retrieve", "Burning retrieve"],
                "recommended_colors": ["Natural shad", "Chartreuse", "Red", "White", "Firetiger"],
                "common_mistakes": ["Retrieving too fast", "Not varying retrieve", "Wrong depth"],
                "notes": "Versatile lure that can be fished at any depth. Great for covering water and finding fish."
            },
            "Medium Diving Crankbait": {
                "description": "Crankbait with medium diving lip that runs 5-10 feet deep",
                "visual_features": ["medium diving lip", "rounded body", "fish-like shape", "hooks"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Walleye"],
                "best_seasons": ["Spring", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "50-75",
                    "depth_ft": "5-10",
                    "structure_cover": ["rocks", "wood", "drop-offs", "points"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Bouncing off structure"],
                "recommended_colors": ["Natural shad", "Crawfish", "Bluegill", "Chartreuse"],
                "common_mistakes": ["Not reaching target depth", "Retrieving too fast", "Wrong color"],
                "notes": "Versatile depth range. Perfect for mid-depth structure and suspended fish."
            },
            "Crankbait": {
                "description": "Rectangular body with diving lip, mimics baitfish swimming",
                "visual_features": ["diving lip", "rectangular body", "fish-like shape", "hooks"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Walleye"],
                "best_seasons": ["Spring", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "50-75",
                    "depth_ft": "2-8",
                    "structure_cover": ["rocks", "wood", "shoreline", "weeds"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Bouncing off structure"],
                "recommended_colors": ["Natural shad", "Crawfish", "Bluegill", "Chartreuse"],
                "common_mistakes": ["Not deflecting off structure", "Retrieving too fast", "Wrong depth for conditions"],
                "notes": "Perfect for deflecting off rocks and wood. Match the hatch with natural colors."
            },
            
            # JERKBAITS
            "Suspending Jerkbait": {
                "description": "Jerkbait that suspends in the water column when paused, deadly in cold water",
                "visual_features": ["long thin body", "segmented", "suspending design", "realistic fish shape"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Walleye"],
                "best_seasons": ["Winter", "Early Spring", "Late Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "35-60",
                    "depth_ft": "2-15",
                    "structure_cover": ["open water", "drop-offs", "suspended fish"]
                },
                "retrieve_styles": ["Jerk-pause", "Long pauses", "Suspending"],
                "recommended_colors": ["Natural shad", "Bluegill", "Crawfish", "White", "Chartreuse"],
                "common_mistakes": ["Too much action", "Not pausing long enough", "Wrong water temperature"],
                "notes": "Deadly in cold water. The suspending action triggers strikes from inactive fish. Pause 5-30 seconds."
            },
            "Floating Jerkbait": {
                "description": "Jerkbait that floats to the surface when paused",
                "visual_features": ["long thin body", "segmented", "floating design", "realistic fish shape"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "50-75",
                    "depth_ft": "1-10",
                    "structure_cover": ["open water", "shoreline", "shallow structure"]
                },
                "retrieve_styles": ["Jerk-pause", "Walking action", "Floating"],
                "recommended_colors": ["Natural shad", "Bluegill", "Crawfish", "White", "Chartreuse"],
                "common_mistakes": ["Too much action", "Wrong pause timing", "Not matching conditions"],
                "notes": "Great for shallow water and active fish. The floating action creates a natural presentation."
            },
            "Sinking Jerkbait": {
                "description": "Jerkbait that sinks when paused, allows fishing at various depths",
                "visual_features": ["long thin body", "segmented", "sinking design", "realistic fish shape"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Walleye"],
                "best_seasons": ["Spring", "Fall", "Winter"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "40-70",
                    "depth_ft": "5-20",
                    "structure_cover": ["open water", "drop-offs", "deep structure"]
                },
                "retrieve_styles": ["Jerk-pause", "Countdown", "Sinking"],
                "recommended_colors": ["Natural shad", "Bluegill", "Crawfish", "White", "Chartreuse"],
                "common_mistakes": ["Not counting down", "Too much action", "Wrong depth"],
                "notes": "Versatile depth control. Count down to desired depth before starting retrieve."
            },
            "Jerkbait": {
                "description": "Very long and thin lure, often with multiple segments for realistic movement",
                "visual_features": ["very long", "thin body", "segmented", "realistic fish shape"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Walleye"],
                "best_seasons": ["Winter", "Spring", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "35-70",
                    "depth_ft": "2-15",
                    "structure_cover": ["open water", "shoreline", "drop-offs"]
                },
                "retrieve_styles": ["Jerk-pause", "Suspending", "Floating", "Sinking"],
                "recommended_colors": ["Natural shad", "Bluegill", "Crawfish", "White", "Chartreuse"],
                "common_mistakes": ["Too much action", "Wrong pause timing", "Not matching water temperature"],
                "notes": "Excellent for cold water and suspended fish. Suspending models are deadly in winter."
            },
            
            # TOPWATER
            "Topwater Popper": {
                "description": "Topwater lure with concave face that creates popping and splashing sounds",
                "visual_features": ["concave face", "wide body", "popping design", "surface action"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "60-85",
                    "depth_ft": "1-5",
                    "structure_cover": ["shoreline", "weeds", "wood", "rocks"]
                },
                "retrieve_styles": ["Pop-pause", "Pop-pop-pause", "Steady popping"],
                "recommended_colors": ["Natural shad", "Bluegill", "White", "Black", "Chartreuse"],
                "common_mistakes": ["Too much noise", "Not pausing", "Wrong timing"],
                "notes": "Create a pop, then pause. The pause is when most strikes occur. Best during low light."
            },
            "Walking Bait": {
                "description": "Topwater lure designed to walk side-to-side with a zigzag motion",
                "visual_features": ["long body", "walking design", "side-to-side action", "surface lure"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "60-85",
                    "depth_ft": "1-5",
                    "structure_cover": ["open water", "shoreline", "weeds"]
                },
                "retrieve_styles": ["Walking the dog", "Zigzag retrieve", "Steady walking"],
                "recommended_colors": ["Natural shad", "Bluegill", "White", "Black", "Chartreuse"],
                "common_mistakes": ["Not creating walking action", "Too fast", "Wrong rod angle"],
                "notes": "Use a side-to-side rod tip motion to create the walking action. Keep line tight and rod tip low."
            },
            "Buzzbait": {
                "description": "Topwater spinnerbait with blade that creates surface commotion and buzzing sound",
                "visual_features": ["spinning blade", "wire frame", "skirt", "buzzing action", "surface lure"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "55-85",
                    "depth_ft": "1-5",
                    "structure_cover": ["weeds", "shoreline", "wood", "grass"]
                },
                "retrieve_styles": ["Steady retrieve", "Burning retrieve", "Stop and go"],
                "recommended_colors": ["White", "Chartreuse", "Black", "White and chartreuse"],
                "common_mistakes": ["Retrieving too slow", "Not keeping on surface", "Wrong blade size"],
                "notes": "Keep it on the surface. The blade must be spinning to create the buzzing sound that attracts fish."
            },
            "Prop Bait": {
                "description": "Topwater lure with propellers on front and/or back that create surface disturbance",
                "visual_features": ["propellers", "body", "props on front/back", "surface action"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "60-85",
                    "depth_ft": "1-5",
                    "structure_cover": ["shoreline", "weeds", "wood", "rocks"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Twitching"],
                "recommended_colors": ["Natural shad", "Bluegill", "White", "Black", "Chartreuse"],
                "common_mistakes": ["Too much action", "Not pausing", "Wrong timing"],
                "notes": "The props create commotion on the surface. Pause to let fish locate and strike."
            },
            "Frog": {
                "description": "Topwater soft plastic frog designed for heavy cover and vegetation",
                "visual_features": ["frog shape", "soft plastic", "legs", "hollow body", "weedless design"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass"],
                "best_seasons": ["Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "65-85",
                    "depth_ft": "1-3",
                    "structure_cover": ["heavy weeds", "lily pads", "grass", "matted vegetation"]
                },
                "retrieve_styles": ["Walk the frog", "Pop-pause", "Steady retrieve"],
                "recommended_colors": ["Natural green", "White", "Black", "Chartreuse", "Brown"],
                "common_mistakes": ["Setting hook too early", "Not walking properly", "Wrong rod"],
                "notes": "Wait for the weight of the fish before setting the hook. Designed for heavy cover fishing."
            },
            "Topwater": {
                "description": "Wide, flat lure that floats on surface, creates splashing and popping sounds",
                "visual_features": ["wide body", "flat shape", "surface action", "popping sounds"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "60-85",
                    "depth_ft": "1-5",
                    "structure_cover": ["shoreline", "weeds", "wood", "rocks"]
                },
                "retrieve_styles": ["Pop-pause", "Walking the dog", "Steady retrieve"],
                "recommended_colors": ["Natural shad", "Bluegill", "White", "Black", "Chartreuse"],
                "common_mistakes": ["Too much noise", "Wrong timing", "Not being patient"],
                "notes": "Most exciting way to catch bass. Best during low light and calm conditions."
            },
            
            # SOFT PLASTIC WORMS
            "Straight Tail Worm": {
                "description": "Soft plastic worm with straight tail, subtle action perfect for finesse fishing",
                "visual_features": ["straight tail", "long body", "flexible", "natural colors"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "1-25",
                    "structure_cover": ["weeds", "rocks", "wood", "drop-offs"]
                },
                "retrieve_styles": ["Texas rig", "Carolina rig", "Wacky rig", "Drop shot"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Watermelon", "Black"],
                    "stained_water": ["Junebug", "Purple", "Black", "Chartreuse"],
                    "muddy_water": ["Black", "Chartreuse", "White"]
                },
                "common_mistakes": ["Too much action", "Not being patient", "Wrong hook size"],
                "notes": "Subtle action works great in clear water and for pressured fish. Less is more."
            },
            "Curly Tail Worm": {
                "description": "Soft plastic worm with curly tail that creates action when retrieved",
                "visual_features": ["curly tail", "long body", "spiral tail", "action tail"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "1-20",
                    "structure_cover": ["weeds", "rocks", "wood", "shoreline"]
                },
                "retrieve_styles": ["Texas rig", "Carolina rig", "Swim retrieve", "Hop and pause"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Watermelon", "Black"],
                    "stained_water": ["Junebug", "Purple", "Black", "Chartreuse"],
                    "muddy_water": ["Black", "Chartreuse", "White", "Bright colors"]
                },
                "common_mistakes": ["Retrieving too fast", "Not using tail action", "Wrong presentation"],
                "notes": "The curly tail creates action on its own. Great for active fish and stained water."
            },
            "Ribbon Tail Worm": {
                "description": "Soft plastic worm with long ribbon-like tail that creates maximum action",
                "visual_features": ["ribbon tail", "long body", "fluttering tail", "action tail"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "50-85",
                    "depth_ft": "1-20",
                    "structure_cover": ["weeds", "rocks", "wood", "shoreline"]
                },
                "retrieve_styles": ["Texas rig", "Carolina rig", "Swim retrieve", "Drag and pause"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Watermelon", "Black"],
                    "stained_water": ["Junebug", "Purple", "Black", "Chartreuse"],
                    "muddy_water": ["Black", "Chartreuse", "White", "Bright colors"]
                },
                "common_mistakes": ["Retrieving too fast", "Not letting tail work", "Wrong size"],
                "notes": "The ribbon tail creates maximum action and vibration. Perfect for aggressive fish."
            },
            "Finesse Worm": {
                "description": "Small, thin soft plastic worm designed for finesse techniques and pressured fish",
                "visual_features": ["small size", "thin body", "subtle action", "natural colors"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall", "Winter"],
                "best_conditions": {
                    "water_clarity": ["clear"],
                    "water_temperature_f": "40-80",
                    "depth_ft": "1-30",
                    "structure_cover": ["all types", "pressured waters"]
                },
                "retrieve_styles": ["Drop shot", "Neko rig", "Wacky rig", "Shakey head"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Watermelon", "Black"],
                    "stained_water": ["Junebug", "Purple", "Black"],
                    "muddy_water": ["Black", "Chartreuse"]
                },
                "common_mistakes": ["Too much action", "Wrong size", "Not being patient"],
                "notes": "Designed for pressured fish and clear water. Subtle presentation is key."
            },
            "Senko Stick Bait": {
                "description": "Straight, soft plastic stick bait with subtle action, deadly when wacky rigged",
                "visual_features": ["straight body", "no tail", "soft material", "sinking action"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "1-15",
                    "structure_cover": ["all types"]
                },
                "retrieve_styles": ["Wacky rig", "Texas rig", "Neko rig", "Drop shot"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Watermelon", "Black"],
                    "stained_water": ["Junebug", "Purple", "Black", "Chartreuse"],
                    "muddy_water": ["Black", "Chartreuse", "White"]
                },
                "common_mistakes": ["Too much action", "Not letting it fall", "Wrong rigging"],
                "notes": "The fall is what triggers strikes. Let it sink naturally. Wacky rig is most effective."
            },
            "Soft Plastic Worm": {
                "description": "Long, flexible plastic worms that mimic natural bait, excellent for finesse fishing",
                "visual_features": ["long body", "flexible material", "realistic texture", "natural colors"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Trout"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "1-25",
                    "structure_cover": ["weeds", "rocks", "wood", "shoreline", "drop-offs"]
                },
                "retrieve_styles": ["Texas rig", "Carolina rig", "Wacky rig", "Drop shot", "Neko rig"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Watermelon", "Black"],
                    "stained_water": ["Junebug", "Purple", "Black", "Chartreuse"],
                    "muddy_water": ["Black", "Chartreuse", "White", "Bright colors"]
                },
                "common_mistakes": ["Retrieving too fast", "Not being patient", "Wrong hook size", "Poor presentation"],
                "notes": "The most versatile bass lure. Perfect for pressured waters and finicky fish. Match colors to water clarity and use natural movements."
            },
            
            # SWIMBAITS
            "Paddle Tail Swimbait": {
                "description": "Soft plastic swimbait with paddle-shaped tail that creates strong swimming action",
                "visual_features": ["paddle tail", "fish-like body", "swimming action", "realistic shape"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Pike", "Musky"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "2-20",
                    "structure_cover": ["open water", "drop-offs", "weeds", "shoreline"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Jigging", "Slow roll"],
                "recommended_colors": {
                    "clear_water": ["Natural shad", "Bluegill", "Perch", "Silver"],
                    "stained_water": ["Chartreuse", "White", "Black", "Bright colors"],
                    "muddy_water": ["Chartreuse", "White", "Black"]
                },
                "common_mistakes": ["Retrieving too fast", "Wrong size", "Not matching the hatch"],
                "notes": "The paddle tail creates strong vibration and action. Match size to local baitfish."
            },
            "Curly Tail Swimbait": {
                "description": "Soft plastic swimbait with curly tail that creates action when retrieved",
                "visual_features": ["curly tail", "fish-like body", "spiral tail", "swimming action"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Pike"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "2-15",
                    "structure_cover": ["open water", "weeds", "shoreline"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Jigging"],
                "recommended_colors": {
                    "clear_water": ["Natural shad", "Bluegill", "Perch", "Silver"],
                    "stained_water": ["Chartreuse", "White", "Black", "Bright colors"],
                    "muddy_water": ["Chartreuse", "White", "Black"]
                },
                "common_mistakes": ["Retrieving too fast", "Wrong size", "Not using tail action"],
                "notes": "The curly tail adds extra action. Great for active fish and covering water."
            },
            "Hard Body Swimbait": {
                "description": "Hard plastic swimbait with jointed or segmented body for realistic swimming action",
                "visual_features": ["hard plastic", "jointed body", "segmented", "realistic fish shape"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Pike", "Musky"],
                "best_seasons": ["Spring", "Summer", "Fall", "Winter"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "40-80",
                    "depth_ft": "2-25",
                    "structure_cover": ["open water", "drop-offs", "deep structure"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Slow roll", "Jigging"],
                "recommended_colors": {
                    "clear_water": ["Natural shad", "Bluegill", "Perch", "Realistic patterns"],
                    "stained_water": ["Chartreuse", "White", "Black", "Bright colors"],
                    "muddy_water": ["Chartreuse", "White", "Black"]
                },
                "common_mistakes": ["Retrieving too fast", "Wrong size", "Not matching the hatch"],
                "notes": "Expensive but effective. The jointed action is incredibly realistic. Match size to target species."
            },
            "Swimbait": {
                "description": "Soft plastic baits designed to mimic baitfish swimming, often with paddle tails or segmented bodies",
                "visual_features": ["fish-like shape", "paddle tail", "segmented body", "realistic fins", "natural colors"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Pike", "Musky"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "2-20",
                    "structure_cover": ["open water", "drop-offs", "weeds", "shoreline"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Jigging", "Slow roll"],
                "recommended_colors": {
                    "clear_water": ["Natural shad", "Bluegill", "Perch", "Silver"],
                    "stained_water": ["Chartreuse", "White", "Black", "Bright colors"],
                    "muddy_water": ["Chartreuse", "White", "Black", "Bright colors"]
                },
                "common_mistakes": ["Retrieving too fast", "Wrong size for target species", "Not matching the hatch", "Poor hook placement"],
                "notes": "Perfect for covering water and targeting suspended fish. Match the size and color to local baitfish for best results."
            },
            
            # OTHER LURES
            "Jig": {
                "description": "Weighted hook with lead head, typically paired with soft plastic trailer",
                "visual_features": ["lead head", "hook", "skirt or trailer", "weighted design"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Walleye", "Pike"],
                "best_seasons": ["All seasons"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "35-85",
                    "depth_ft": "1-50",
                    "structure_cover": ["all types"]
                },
                "retrieve_styles": ["Hopping", "Dragging", "Swimming", "Jigging", "Dead sticking"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Black", "Blue"],
                    "stained_water": ["Black", "Chartreuse", "Orange", "White"],
                    "muddy_water": ["Black", "Chartreuse", "White", "Bright colors"]
                },
                "common_mistakes": ["Too much action", "Wrong weight", "Not feeling bottom"],
                "notes": "Most versatile lure in bass fishing. Can be fished anywhere at any depth. Match weight to depth and conditions."
            },
            "Chatterbait": {
                "description": "Bladed jig with vibrating blade that creates thumping action and flash",
                "visual_features": ["blade", "jig head", "skirt", "vibrating blade", "thumping action"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "1-15",
                    "structure_cover": ["weeds", "grass", "rocks", "wood"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Burning retrieve", "Yo-yo"],
                "recommended_colors": {
                    "clear_water": ["White", "Chartreuse", "Natural shad", "Blue"],
                    "stained_water": ["Chartreuse", "Orange", "Black", "White"],
                    "muddy_water": ["Chartreuse", "Orange", "Black", "White"]
                },
                "common_mistakes": ["Retrieving too fast", "Not keeping blade working", "Wrong trailer"],
                "notes": "The blade creates strong vibration and flash. Keep it moving to maintain blade action. Great for covering water."
            },
            "Tube": {
                "description": "Hollow soft plastic tube bait, deadly for smallmouth bass and finesse fishing",
                "visual_features": ["hollow tube", "tentacles", "soft plastic", "compact body"],
                "target_species": ["Smallmouth Bass", "Largemouth Bass", "Spotted Bass", "Panfish"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "45-75",
                    "depth_ft": "1-20",
                    "structure_cover": ["rocks", "gravel", "drop-offs", "current"]
                },
                "retrieve_styles": ["Hopping", "Dragging", "Swimming", "Dead sticking"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Watermelon", "Black"],
                    "stained_water": ["Junebug", "Purple", "Black", "Chartreuse"],
                    "muddy_water": ["Black", "Chartreuse", "White"]
                },
                "common_mistakes": ["Too much action", "Wrong size", "Not matching conditions"],
                "notes": "Smallmouth favorite. The tentacles create subtle action. Perfect for rocky areas and current."
            },
            "Grub": {
                "description": "Soft plastic grub with curly tail, versatile bait for multiple species",
                "visual_features": ["curly tail", "compact body", "soft plastic", "action tail"],
                "target_species": ["Smallmouth Bass", "Largemouth Bass", "Panfish", "Walleye", "Trout"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "40-80",
                    "depth_ft": "1-15",
                    "structure_cover": ["all types"]
                },
                "retrieve_styles": ["Steady retrieve", "Jigging", "Hopping", "Swimming"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "White", "Black"],
                    "stained_water": ["Chartreuse", "Orange", "Black", "White"],
                    "muddy_water": ["Chartreuse", "Orange", "Black", "White"]
                },
                "common_mistakes": ["Retrieving too fast", "Wrong size", "Not using tail action"],
                "notes": "Versatile and effective. The curly tail creates action on its own. Great for multiple species."
            },
            "Minnow": {
                "description": "Hard or soft plastic minnow imitation, designed to mimic small baitfish",
                "visual_features": ["minnow shape", "fish-like body", "realistic design", "small size"],
                "target_species": ["Trout", "Smallmouth Bass", "Largemouth Bass", "Walleye", "Pike"],
                "best_seasons": ["Spring", "Summer", "Fall", "Winter"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "35-75",
                    "depth_ft": "1-20",
                    "structure_cover": ["open water", "current", "rocks", "shoreline"]
                },
                "retrieve_styles": ["Steady retrieve", "Stop and go", "Jigging", "Suspending"],
                "recommended_colors": {
                    "clear_water": ["Natural shad", "Silver", "White", "Blue"],
                    "stained_water": ["Chartreuse", "White", "Black", "Bright colors"],
                    "muddy_water": ["Chartreuse", "White", "Black"]
                },
                "common_mistakes": ["Retrieving too fast", "Wrong size", "Not matching the hatch"],
                "notes": "Match the size and color to local baitfish. Effective for multiple species in various conditions."
            },
            "Spoon": {
                "description": "Oval or teardrop shaped metallic lure that wobbles and flashes",
                "visual_features": ["oval shape", "metallic surface", "teardrop", "wobbling action"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Northern Pike", "Musky", "Walleye"],
                "best_seasons": ["Fall", "Winter", "Spring"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained"],
                    "water_temperature_f": "35-70",
                    "depth_ft": "5-30",
                    "structure_cover": ["open water", "drop-offs", "deep structure"]
                },
                "retrieve_styles": ["Jigging", "Trolling", "Casting and retrieving"],
                "recommended_colors": ["Silver", "Gold", "Copper", "White", "Chartreuse"],
                "common_mistakes": ["Too much action", "Wrong size for target species", "Not matching the hatch"],
                "notes": "Excellent for deep water and cold water fishing. Mimics injured baitfish effectively."
            },
            "Creature Bait": {
                "description": "Soft plastic baits with appendages, claws, or tentacles that mimic crustaceans and other creatures",
                "visual_features": ["appendages", "claws", "tentacles", "textured surface", "realistic details"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Catfish"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "50-85",
                    "depth_ft": "1-15",
                    "structure_cover": ["weeds", "rocks", "wood", "shoreline"]
                },
                "retrieve_styles": ["Slow drag", "Hop and pause", "Dead stick", "Swim retrieve"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Watermelon", "Black"],
                    "stained_water": ["Junebug", "Purple", "Black", "Chartreuse"],
                    "muddy_water": ["Black", "Chartreuse", "White", "Bright colors"]
                },
                "common_mistakes": ["Too much action", "Wrong size for conditions", "Not matching the hatch", "Poor hook placement"],
                "notes": "Excellent for aggressive fish and when you need a different presentation. The appendages create natural movement and attract attention."
            },
            "Crawfish Imitation": {
                "description": "Soft plastic baits specifically designed to mimic crawfish, with claws, segmented body, and realistic details",
                "visual_features": ["claws", "segmented body", "realistic details", "natural colors", "textured surface"],
                "target_species": ["Largemouth Bass", "Smallmouth Bass", "Spotted Bass", "Trout", "Pike"],
                "best_seasons": ["Spring", "Summer", "Fall"],
                "best_conditions": {
                    "water_clarity": ["clear", "stained", "muddy"],
                    "water_temperature_f": "45-80",
                    "depth_ft": "1-15",
                    "structure_cover": ["rocks", "weeds", "wood", "shoreline", "drop-offs"]
                },
                "retrieve_styles": ["Hop and pause", "Slow drag", "Dead stick", "Swim retrieve"],
                "recommended_colors": {
                    "clear_water": ["Natural brown", "Green pumpkin", "Watermelon", "Black"],
                    "stained_water": ["Junebug", "Purple", "Black", "Chartreuse"],
                    "muddy_water": ["Black", "Chartreuse", "White", "Bright colors"]
                },
                "common_mistakes": ["Too much action", "Wrong size for conditions", "Not matching the hatch", "Poor presentation"],
                "notes": "Crawfish are a primary food source for bass. Use natural movements and match the size to local crawfish. Best in rocky areas and around structure."
            }
        }
    
    def analyze_lure(self, image_path: str) -> Dict:
        """
        Analyze lure image using ChatGPT Vision API and return comprehensive results
        """
        if not self.openai_api_key:
            return {"error": "OpenAI API key not provided"}
        
        try:
            # Compress image for API efficiency
            print("[INFO] Compressing image for API...")
            compressed_path = self._compress_image_for_api(image_path)
            
            # Encode compressed image to base64
            with open(compressed_path, "rb") as image_file:
                encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            print(f"[INFO] Compressed image size: {len(encoded_image)} characters (base64)")
            
            # ChatGPT Vision API request
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_api_key}"
            }
            
            payload = {
                "model": config.CHATGPT_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Analyze this fishing lure image and provide a detailed classification.

IMPORTANT: Always choose the MOST SPECIFIC lure type that matches. For example:
- If you see TWO spinning blades, choose "Double Blade Spinnerbait" NOT just "Spinnerbait"
- If you see a square diving bill, choose "Squarebill Crankbait" NOT just "Crankbait"
- If you see a paddle tail, choose "Paddle Tail Swimbait" NOT just "Swimbait"
- If you see a curly tail, choose "Curly Tail Worm" NOT just "Soft Plastic Worm"
- Only use general types (like "Spinnerbait", "Crankbait") if you cannot determine a more specific variant

Available lure types (use the most specific match):
Spinnerbaits: Single Blade Spinnerbait, Double Blade Spinnerbait, Inline Spinner, Spinnerbait (general)
Crankbaits: Deep Diving Crankbait, Shallow Crankbait, Squarebill Crankbait, Lipless Crankbait, Medium Diving Crankbait, Crankbait (general)
Jerkbaits: Suspending Jerkbait, Floating Jerkbait, Sinking Jerkbait, Jerkbait (general)
Topwater: Topwater Popper, Walking Bait, Buzzbait, Prop Bait, Frog, Topwater (general)
Worms: Straight Tail Worm, Curly Tail Worm, Ribbon Tail Worm, Finesse Worm, Senko Stick Bait, Soft Plastic Worm (general)
Swimbaits: Paddle Tail Swimbait, Curly Tail Swimbait, Hard Body Swimbait, Swimbait (general)
Other: Jig, Chatterbait, Tube, Grub, Minnow, Spoon, Creature Bait, Crawfish Imitation

Provide:
1. Lure type - MUST be the most specific match from the list above (exact name including spaces and capitalization)
2. Confidence level (0-100%)
3. Key visual features you observe that support this specific classification
4. Why you think it's this specific type (not a general category)
5. Target fish species this lure would attract
                                
Respond in JSON format:
{
    "lure_type": "exact type name from list above",
    "confidence": percentage,
    "visual_features": ["feature1", "feature2"],
    "reasoning": "explanation why this specific type not general category",
    "target_species": ["species1", "species2"]
}"""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{encoded_image}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": config.MAX_TOKENS
            }
            
            print("[INFO] Sending request to ChatGPT Vision API...")
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            print(f"DEBUG: ChatGPT API response status: {response.status_code}")
            print(f"DEBUG: ChatGPT API response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                # Try to parse JSON response (handle markdown code blocks)
                try:
                    # Remove markdown code blocks if present
                    if content.startswith('```json'):
                        content = content.replace('```json', '').replace('```', '').strip()
                    elif content.startswith('```'):
                        content = content.replace('```', '').strip()
                    
                    chatgpt_analysis = json.loads(content)
                    
                    # Get lure type and confidence
                    lure_type = chatgpt_analysis.get("lure_type", "Unknown")
                    confidence = chatgpt_analysis.get("confidence", 0)
                    
                    # Post-process: Upgrade generic types to specific ones based on visual features
                    lure_type = self._upgrade_lure_type_specificity(lure_type, chatgpt_analysis)
                    
                    # Get detailed lure information from database
                    lure_info = self.get_lure_info(lure_type)
                    
                    # Store in history
                    self.analysis_history.append({
                        "timestamp": datetime.datetime.now().isoformat(),
                        "image_path": image_path,
                        "lure_type": lure_type,
                        "confidence": confidence,
                        "analysis": chatgpt_analysis
                    })
                    
                    # Return comprehensive results
                    return {
                        "success": True,
                        "image_path": image_path,
                        "lure_type": lure_type,
                        "confidence": confidence,
                        "chatgpt_analysis": chatgpt_analysis,
                        "lure_details": lure_info,
                        "analysis_method": "ChatGPT Vision API",
                        "analysis_date": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                    
                except json.JSONDecodeError:
                    print(f"[WARNING] JSON parsing failed, raw response: {content}")
                    return {"error": f"Failed to parse ChatGPT response: {content}"}
            else:
                return {"error": f"API request failed: {response.status_code} - {response.text}"}
                
        except Exception as e:
            return {"error": f"Analysis failed: {str(e)}"}
        finally:
            # Clean up compressed image
            if 'compressed_path' in locals():
                self._cleanup_compressed_image(compressed_path)
    
    def _upgrade_lure_type_specificity(self, lure_type: str, chatgpt_analysis: Dict) -> str:
        """
        Post-process lure type to upgrade generic types to specific ones based on visual features and reasoning
        """
        visual_features = chatgpt_analysis.get("visual_features", [])
        reasoning = chatgpt_analysis.get("reasoning", "").lower()
        features_text = " ".join(visual_features).lower()
        combined_text = (features_text + " " + reasoning).lower()
        
        print(f"[DEBUG] Upgrading lure type: {lure_type}")
        print(f"[DEBUG] Visual features: {visual_features}")
        print(f"[DEBUG] Combined text: {combined_text[:200]}...")
        
        # Spinnerbait upgrades
        if lure_type == "Spinnerbait" or lure_type.lower() == "spinnerbait":
            # Check for double/two blades - check for "two" or "double" AND ("blade" or "spinner" or "spinning")
            has_two_or_double = any(term in combined_text for term in ["two", "double", "2 ", "dual", "pair"])
            has_blade_or_spinner = any(term in combined_text for term in ["blade", "spinner", "spinning"])
            
            if has_two_or_double and has_blade_or_spinner:
                upgraded = "Double Blade Spinnerbait"
                print(f"[DEBUG] Upgraded {lure_type} -> {upgraded}")
                print(f"[DEBUG] Matched: two/double={has_two_or_double}, blade/spinner={has_blade_or_spinner}")
                return upgraded
            # Check for single blade
            elif any(term in combined_text for term in ["single", "one", "1 "]):
                if any(term in combined_text for term in ["blade", "spinner"]):
                    upgraded = "Single Blade Spinnerbait"
                    print(f"[DEBUG] Upgraded {lure_type} -> {upgraded}")
                    return upgraded
            # Check for inline spinner
            elif "inline" in combined_text or "straight wire" in combined_text:
                upgraded = "Inline Spinner"
                print(f"[DEBUG] Upgraded {lure_type} -> {upgraded}")
                return upgraded
        
        # Crankbait upgrades
        elif lure_type == "Crankbait":
            if any(term in combined_text for term in ["deep", "deep diving", "deep diving"]):
                return "Deep Diving Crankbait"
            elif any(term in combined_text for term in ["shallow", "shallow running"]):
                return "Shallow Crankbait"
            elif any(term in combined_text for term in ["square", "squarebill", "square bill"]):
                return "Squarebill Crankbait"
            elif any(term in combined_text for term in ["lipless", "no lip", "without lip"]):
                return "Lipless Crankbait"
            elif any(term in combined_text for term in ["medium", "mid-depth"]):
                return "Medium Diving Crankbait"
        
        # Jerkbait upgrades
        elif lure_type == "Jerkbait":
            if any(term in combined_text for term in ["suspend", "suspending", "hangs"]):
                return "Suspending Jerkbait"
            elif any(term in combined_text for term in ["float", "floating", "rises"]):
                return "Floating Jerkbait"
            elif any(term in combined_text for term in ["sink", "sinking", "drops"]):
                return "Sinking Jerkbait"
        
        # Topwater upgrades
        elif lure_type == "Topwater":
            if any(term in combined_text for term in ["pop", "popper", "popping", "concave"]):
                return "Topwater Popper"
            elif any(term in combined_text for term in ["walk", "walking", "zigzag", "side-to-side"]):
                return "Walking Bait"
            elif any(term in combined_text for term in ["buzz", "buzzing", "spinning blade"]):
                return "Buzzbait"
            elif any(term in combined_text for term in ["prop", "propeller", "props"]):
                return "Prop Bait"
            elif any(term in combined_text for term in ["frog", "legs", "hollow body"]):
                return "Frog"
        
        # Worm upgrades
        elif lure_type == "Soft Plastic Worm":
            if any(term in combined_text for term in ["straight tail", "no tail action", "straight"]):
                return "Straight Tail Worm"
            elif any(term in combined_text for term in ["curly tail", "curly", "spiral tail"]):
                return "Curly Tail Worm"
            elif any(term in combined_text for term in ["ribbon tail", "ribbon", "fluttering"]):
                return "Ribbon Tail Worm"
            elif any(term in combined_text for term in ["finesse", "small", "thin", "tiny"]):
                return "Finesse Worm"
            elif any(term in combined_text for term in ["senko", "stick bait", "stick", "straight body"]):
                return "Senko Stick Bait"
        
        # Swimbait upgrades
        elif lure_type == "Swimbait":
            if any(term in combined_text for term in ["paddle tail", "paddle", "broad tail"]):
                return "Paddle Tail Swimbait"
            elif any(term in combined_text for term in ["curly tail", "curly", "spiral tail"]):
                return "Curly Tail Swimbait"
            elif any(term in combined_text for term in ["hard", "hard plastic", "jointed", "segmented body"]):
                return "Hard Body Swimbait"
        
        # Return original type if no upgrade found
        return lure_type
    
    def get_lure_info(self, lure_type: str) -> Dict:
        """Get comprehensive lure information from database"""
        return self.lure_database.get(lure_type, {})
    
    def get_analysis_history(self) -> List[Dict]:
        """Get analysis history for monitoring and improvement"""
        return self.analysis_history
    
    def save_analysis_to_json(self, analysis_results: Dict, output_path: str = None) -> str:
        """
        Save analysis results to a JSON file in an organized directory structure
        """
        # Create organized directory structure
        results_dir = config.RESULTS_FOLDER
        os.makedirs(results_dir, exist_ok=True)
        
        # Create subdirectories by date
        today = datetime.datetime.now()
        date_dir = today.strftime("%Y-%m-%d")
        full_results_dir = os.path.join(results_dir, date_dir)
        os.makedirs(full_results_dir, exist_ok=True)
        
        # Generate filename with timestamp
        if output_path is None:
            # Extract image name from results if available
            image_path = analysis_results.get("image_path", "analysis")
            if isinstance(image_path, str):
                base_name = os.path.basename(image_path)
                base_name = os.path.splitext(base_name)[0]
            else:
                base_name = "analysis"
            
            timestamp = today.strftime("%H-%M-%S")
            output_path = f"{base_name}_{timestamp}_analysis.json"
        
        # Ensure the filename has .json extension
        if not output_path.endswith('.json'):
            output_path += '.json'
        
        # Full path including organized directory
        full_output_path = os.path.join(full_results_dir, output_path)
        
        # Save the file
        with open(full_output_path, 'w') as f:
            json.dump(analysis_results, f, indent=2)
        
        return full_output_path

    def _compress_image_for_api(self, image_path: str, max_size_kb: int = None) -> str:
        """
        Compress image for API while preserving important lure details
        """
        if max_size_kb is None:
            max_size_kb = config.TARGET_COMPRESSION_KB
            
        try:
            # Ensure uploads directory exists
            os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
            
            # Open image with PIL
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Get original dimensions
                original_width, original_height = img.size
                print(f"Original image: {original_width}x{original_height}")
                
                # Calculate target dimensions (maintain aspect ratio)
                # ChatGPT works well with images around 800-1200px on longest side
                max_dimension = config.MAX_IMAGE_DIMENSION
                new_width, new_height = original_width, original_height
                
                if original_width > max_dimension or original_height > max_dimension:
                    if original_width > original_height:
                        new_width = max_dimension
                        new_height = int((original_height * max_dimension) / original_width)
                    else:
                        new_height = max_dimension
                        new_width = int((original_width * max_dimension) / original_height)
                    
                    # Resize image
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    print(f"Resized to: {new_width}x{new_height}")
                
                # Create compressed version path
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                compressed_path = f"{config.UPLOAD_FOLDER}/compressed_{base_name}.jpg"
                
                # Save with quality optimization
                quality = 95
                img.save(compressed_path, 'JPEG', quality=quality, optimize=True)
                
                # Check file size and reduce quality if needed
                file_size_kb = os.path.getsize(compressed_path) / 1024
                print(f"Compressed size: {file_size_kb:.1f} KB")
                
                # If still too large, reduce quality further
                if file_size_kb > max_size_kb:
                    quality = 85
                    img.save(compressed_path, 'JPEG', quality=quality, optimize=True)
                    file_size_kb = os.path.getsize(compressed_path) / 1024
                    print(f"Further compressed: {file_size_kb:.1f} KB")
                
                # If still too large, resize more aggressively
                if file_size_kb > max_size_kb:
                    # Reduce to 800px max dimension
                    if new_width > 800 or new_height > 800:
                        if new_width > new_height:
                            new_width = 800
                            new_height = int((new_height * 800) / new_width)
                        else:
                            new_height = 800
                            new_width = int((new_width * 800) / new_height)
                        
                        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                        img.save(compressed_path, 'JPEG', quality=quality, optimize=True)
                        file_size_kb = os.path.getsize(compressed_path) / 1024
                        print(f"Aggressively compressed: {file_size_kb:.1f} KB")
                
                print(f"[OK] Image compressed successfully: {compressed_path}")
                return compressed_path
                
        except Exception as e:
            print(f"[ERROR] Image compression failed: {str(e)}")
            return image_path  # Return original if compression fails
    
    def _cleanup_compressed_image(self, compressed_path: str):
        """
        Clean up compressed image after analysis
        """
        try:
            if compressed_path != compressed_path and os.path.exists(compressed_path):
                os.remove(compressed_path)
                print(f"[INFO] Cleaned up compressed image: {compressed_path}")
        except Exception as e:
            print(f"[WARNING] Failed to cleanup compressed image: {str(e)}")

    def estimate_api_cost(self, image_path: str) -> Dict:
        """
        Estimate API cost and token usage for an image
        """
        try:
            # Compress image to see final size
            compressed_path = self._compress_image_for_api(image_path)
            
            # Get compressed image size
            file_size_kb = os.path.getsize(compressed_path) / 1024
            
            # Estimate tokens (rough calculation)
            # Base64 encoding increases size by ~33%
            # ChatGPT Vision pricing: $0.01 per 1K tokens (input)
            estimated_tokens = int((file_size_kb * 1.33) * 0.75)  # Rough estimate
            estimated_cost = (estimated_tokens / 1000) * 0.01
            
            # Clean up compressed image
            self._cleanup_compressed_image(compressed_path)
            
            return {
                "original_size_kb": os.path.getsize(image_path) / 1024,
                "compressed_size_kb": file_size_kb,
                "compression_ratio": f"{((os.path.getsize(image_path) - os.path.getsize(compressed_path)) / os.path.getsize(image_path) * 100):.1f}%",
                "estimated_tokens": estimated_tokens,
                "estimated_cost_usd": f"${estimated_cost:.4f}",
                "cost_efficiency": "[OK] Good" if file_size_kb < 500 else "[WARNING] High cost"
            }
            
        except Exception as e:
            return {"error": f"Cost estimation failed: {str(e)}"}

def main():
    """Example usage of the Mobile Lure Classifier"""
    print("Mobile Lure Classifier Demo")
    print("=" * 50)
    
    # Initialize classifier (you'll need to add your OpenAI API key)
    classifier = MobileLureClassifier()
    
    print("[INFO] To use ChatGPT Vision API, set your OpenAI API key in config.py:")
    print("   OPENAI_API_KEY = 'your-actual-api-key-here'")
    
    print("\n[INFO] Available analysis methods:")
    print("   1. classifier.analyze_lure(image_path) - ChatGPT Vision analysis")
    print("   2. classifier.get_lure_info(lure_type) - Get lure information")
    print("   3. classifier.estimate_api_cost(image_path) - Cost estimation")
    
    print("\n[INFO] Benefits of mobile-optimized approach:")
    print("   - Lightweight: No heavy CV models")
    print("   - Fast: API-first architecture")
    print("   - Accurate: ChatGPT Vision analysis")
    print("   - Comprehensive: Rich lure database")
    print("   - Mobile-friendly: Optimized for phones")

if __name__ == "__main__":
    main()
