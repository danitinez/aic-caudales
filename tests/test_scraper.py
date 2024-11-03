import unittest
from bs4 import BeautifulSoup
from scrapper.data_gatherer import DataGatherer

class TestGatherData(unittest.TestCase):
    
    def test_gather_data(self):
        with open('tests/test.html', 'r') as file:
            html_content = file.read()

        gatherer = DataGatherer()
        sections = gatherer.parse(html_content)

        self.assertEqual(sections.last_update, '2024-05-12')
        self.assertEqual(len(sections.sections), 5)
        
        # Check the first section
        section = sections.sections[0]
        self.assertEqual(section.name, 'Portezuelo Grande')
        
        # Check the levels of the first section
        levels = section.levels
        self.assertEqual(len(levels), 6)
        
        # Check each level
        self.assertEqual(levels[0].type, 'dispensed')
        self.assertEqual(levels[0].date, '2024-05-11')
        self.assertIsNone(levels[0].min)
        self.assertIsNone(levels[0].max)
        self.assertEqual(levels[0].dispensed, '12')
        
        for i in range(1, 6):
            self.assertEqual(levels[i].type, 'programmed')
            self.assertEqual(levels[i].date, f'2024-05-{11 + i}')
            self.assertEqual(levels[i].min, 12)
            self.assertEqual(levels[i].max, 10)
            self.assertIsNone(levels[i].dispensed)


         # Check the last section
        section = sections.sections[-1]
        self.assertEqual(section.name, 'El Chañar + Arroyito')
        
        # Check the levels of the last section
        levels = section.levels
        self.assertEqual(len(levels), 6)
        
        # Check each level
        self.assertEqual(levels[0].type, 'dispensed')
        self.assertEqual(levels[0].date, '2024-05-11')
        self.assertIsNone(levels[0].min)
        self.assertIsNone(levels[0].max)
        self.assertEqual(levels[0].dispensed, '694')
        
        self.assertEqual(levels[1].type, 'programmed')
        self.assertEqual(levels[1].date, '2024-05-12')
        self.assertEqual(levels[1].min, 830)
        self.assertEqual(levels[1].max, 770)
        self.assertIsNone(levels[1].dispensed)
        
        for i in range(2, 6):
            self.assertEqual(levels[i].type, 'programmed')
            self.assertEqual(levels[i].date, f'2024-05-{11 + i}')
            self.assertEqual(levels[i].min, 840)
            self.assertEqual(levels[i].max, 800)
            self.assertIsNone(levels[i].dispensed)



    def test_gather_data2(self):
        with open('tests/test2.html', 'r') as file:
            html_content = file.read()

        gatherer = DataGatherer()
        sections = gatherer.parse(html_content)

        self.assertEqual(sections.last_update, '2024-11-03')
        self.assertEqual(len(sections.sections), 5)
        
        # Check the first section
        section = sections.sections[0]
        self.assertEqual(section.name, 'Portezuelo Grande')
        
        # Check the levels of the first section
        levels = section.levels
        self.assertEqual(len(levels), 6)
        
        # Check each level
        self.assertEqual(levels[0].type, 'dispensed')
        self.assertEqual(levels[0].date, '2024-11-02')
        self.assertIsNone(levels[0].min)
        self.assertIsNone(levels[0].max)
        self.assertEqual(levels[0].dispensed, '12')
        
        for i in range(1, 6):
            self.assertEqual(levels[i].type, 'programmed')
            self.assertEqual(levels[i].date, f'2024-11-0{2 + i}')
            self.assertEqual(levels[i].min, 12)
            self.assertEqual(levels[i].max, 10)
            self.assertIsNone(levels[i].dispensed)


         # Check the last section
        section = sections.sections[-1]
        self.assertEqual(section.name, 'El Chañar + Arroyito')
        
        # Check the levels of the last section
        levels = section.levels
        self.assertEqual(len(levels), 6)
        
        # Check each level
        self.assertEqual(levels[0].type, 'dispensed')
        self.assertEqual(levels[0].date, '2024-11-02')
        self.assertIsNone(levels[0].min)
        self.assertIsNone(levels[0].max)
        self.assertEqual(levels[0].dispensed, '511')
        
        for i in range(1, 6):
            self.assertEqual(levels[i].type, 'programmed')
            self.assertEqual(levels[i].date, f'2024-11-0{2 + i}')
            self.assertEqual(levels[i].min, 570)
            self.assertEqual(levels[i].max, 530)
            self.assertIsNone(levels[i].dispensed)
        

if __name__ == '__main__':
    unittest.main()