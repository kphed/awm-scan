import { Link, Stack, type StackProps } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Explorer", href: "/" },
  { label: "Architecture", href: "/architecture" },
  { label: "Source", href: "/source" },
];

export function isCurrentPath(pathname: string, href: string) {
  // The root route must match exactly, while nested sections should keep the
  // parent nav item active for deeper paths like /architecture/details.
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

const NavbarLinks = (props: StackProps) => {
  const pathname = usePathname();

  return (
    <Stack
      direction={{ base: "column", md: "row" }}
      gap={{ base: "6", md: "8" }}
      {...props}
    >
      {NAV_LINKS.map((item) => {
        const isCurrentPage = isCurrentPath(pathname, item.href);

        return (
          <Link
            key={item.href}
            as={NextLink}
            href={item.href}
            fontWeight="medium"
            color="fg.muted"
            aria-current={isCurrentPage ? "page" : undefined}
            _hover={{
              color: "fg",
              textDecoration: "none",
            }}
            _currentPage={{ color: "fg" }}
          >
            {item.label}
          </Link>
        );
      })}
    </Stack>
  );
};

export default NavbarLinks;
